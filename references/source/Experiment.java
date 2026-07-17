/*
Copyright 2002, David H. McIntyre
Department of Physics, Oregon State University, Corvallis, OR 97331-6507  
http://www.physics.orst.edu/~mcintyre/

This file is part of SPINS.

SPINS is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

SPINS is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with SPINS; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
*/
import java.util.*;
import javax.swing.*;
import java.awt.*;
import java.io.*;

public class Experiment extends Thread implements Serializable{
    private Vector components;
    private Vector lines;
    
    // parameter to control how long output lights are on
    private int watchTime = 30;
    
    static Experiment instance;
    //some global variables of deviceSurface objects:
    //system is switched between 0, 1, and 2, which indicates either a
    //Spin 1/2, Spin 1, or SU(3) system. The value of system implies the
    //value of state, which is 2 for Spin 1/2 and 3 for Spin 1 and SU(3).
    //The value of whichInit determines the InitialStateVector of the atoms
    //leaving the gun.  One can choose Unknown#1 (0), Unknown#2 (1), 
    //Unknown#3 (2), Unknown#4 (3), User State (4), or Random (5)
    private int system;
    private int state;
    private int whichInit;
    private double phi;
    private double theta;
    public final static int [][] typeTable = new int [3][8];

   /*********************************************************************/
   /*all the vectors and matrices that are used for computing probability*/
   /*********************************************************************/
    private Complex cZero, cOne, ci, cMinusOne, cMinusi;
    public static Matrix identity;
    private final int opCount = 12; //number of different operator matrices
    private final double root2inv = 1.0/Math.sqrt(2.0);
    public vector[][] EigenVector;
    private vector[][] InitialState;   
    public static Matrix[] oper;		//operators
    public static Matrix[] opSquared; 	//squares of operators 

    public Experiment(){
         instance = this;
    
         components = new Vector();
         lines = new Vector();
         
         setSystem(0);		//Spin 1/2 is the default system
         setWhichInit(5);	//Random is the default InitialState
         
         //define sizes for arrays
         EigenVector = new vector[opCount][3];         
         oper = new Matrix[opCount];         
         InitialState = new vector[3][5];
         opSquared = new Matrix[opCount];                
         
         initVectors(); 
    }
    
   /******************************************************************/
   /*initialize all the vectors and matrices for computing probability*/
   /******************************************************************/
   public void initVectors(){
       cZero = new Complex(0.0, 0.0);
       cOne = new Complex(1.0, 0.0);
       ci = new Complex(0.0, 1.0);
       cMinusOne = new Complex(-1.0, 0.0);
       cMinusi = new Complex(0.0, -1.0);
       
       identity = new Matrix();
       for (int i=0; i<3; i++){
           identity.data[i][i] = cOne;
       } 
       
       for (int i=0; i<opCount; i++){
           oper[i] = new Matrix();       
           for (int j=0; j<3; j++){
               EigenVector[i][j] = new vector();
           }
       }
       /*
	   For operators, the first index (oper[]) takes the value op from
	   the typeTable below.  The two indices on data are row and column
	   of matrix for operator.  For eigenvector, the first index is op, the second
	   labels the eigenvector, and the third (on data) labels the row.  Note that
	   for Spin 1, the eigenvectors are ordered in a non-conventional way; the
	   second index  0,1,2 corresponds to eigenvalues 1, -1, 0.
	   */
	   //Sx Spin 1/2 Pauli matrix and eigenstates
       oper[0].data[0][1] = cOne;
       oper[0].data[1][0] = cOne;
       EigenVector[0][0].data[0] = new Complex(root2inv, 0.0);
       EigenVector[0][0].data[1] = new Complex(root2inv, 0.0);
       EigenVector[0][1].data[0] = new Complex(root2inv, 0.0);
       EigenVector[0][1].data[1] = new Complex(-root2inv, 0.0);
       EigenVector[0][2].data[2] = cOne;
       
       //Sy Spin 1/2 Pauli matrix and eigenstates
       oper[1].data[0][1] = cMinusi;
       oper[1].data[1][0] = ci;       
       EigenVector[1][0].data[0] = new Complex(root2inv, 0.0);
       EigenVector[1][0].data[1] = new Complex(0.0, root2inv);
       EigenVector[1][1].data[0] = new Complex(root2inv, 0.0);
       EigenVector[1][1].data[1] = new Complex(0.0, -root2inv);
       EigenVector[1][2].data[2] = cOne;
       
       //Sz Spin 1/2 Pauli matrix and eigenstates
       oper[2].data[0][0] = cOne;
       oper[2].data[1][1] = cMinusOne;      
       EigenVector[2][0].data[0] = cOne;
       EigenVector[2][1].data[1] = cOne;
       EigenVector[2][2].data[2] = cOne;
       
       //Lambda 4 SU(3) matrix and eigenstates
       oper[3].data[0][2] = cOne;
       oper[3].data[2][0] = cOne; 
       EigenVector[3][0].data[0] = new Complex(root2inv, 0.0);
       EigenVector[3][0].data[2] = new Complex(root2inv, 0.0);
       EigenVector[3][1].data[0] = new Complex(root2inv, 0.0);
       EigenVector[3][1].data[2] = new Complex(-root2inv, 0.0);
       EigenVector[3][2].data[1] = cOne;
       
       //Lambda 5 SU(3) matrix and eigenstates
       oper[4].data[0][2] = cMinusi;
       oper[4].data[2][0] = ci; 
       EigenVector[4][0].data[0] = new Complex(root2inv, 0.0);
       EigenVector[4][0].data[2] = new Complex(0.0, root2inv);
       EigenVector[4][1].data[0] = new Complex(root2inv, 0.0);
       EigenVector[4][1].data[2] = new Complex(0.0, -root2inv);
       EigenVector[4][2].data[1] = cOne;
       
       //Lambda 6 SU(3) matrix and eigenstates
       oper[5].data[1][2] = cOne;
       oper[5].data[2][1] = cOne; 
       EigenVector[5][0].data[1] = new Complex(root2inv, 0.0);      
       EigenVector[5][0].data[2] = new Complex(root2inv, 0.0);
       EigenVector[5][1].data[1] = new Complex(root2inv, 0.0);
       EigenVector[5][1].data[2] = new Complex(-root2inv, 0.0);
       EigenVector[5][2].data[0] = cOne;
       
       //Lambda 7 SU(3) matrix and eigenstates
       oper[6].data[1][2] = cMinusi;
       oper[6].data[2][1] = ci; 
       EigenVector[6][0].data[1] = new Complex(root2inv, 0.0);
       EigenVector[6][0].data[2] = new Complex(0.0, root2inv);
       EigenVector[6][1].data[1] = new Complex(root2inv, 0.0);
       EigenVector[6][1].data[2] = new Complex(0.0, -root2inv);
       EigenVector[6][2].data[0] = cOne;
       
       //Sz Spin 1 matrix and eigenstates
       oper[7].data[0][0] = cOne;
       oper[7].data[2][2] = cMinusOne; 
       EigenVector[7][0].data[0] = cOne;			//|+1>
       EigenVector[7][1].data[2] = cOne;			//|-1>
       EigenVector[7][2].data[1] = cOne;			//|0>
       
       //Sx Spin 1 matrix and eigenstates
       oper[8].data[0][1] = new Complex(root2inv, 0.0);
       oper[8].data[1][0] = new Complex(root2inv, 0.0);
       oper[8].data[1][2] = new Complex(root2inv, 0.0);
       oper[8].data[2][1] = new Complex(root2inv, 0.0);         
       EigenVector[8][0].data[0] = new Complex(0.5, 0.0);
       EigenVector[8][0].data[1] = new Complex(root2inv, 0.0);
       EigenVector[8][0].data[2] = new Complex(0.5, 0.0);
       EigenVector[8][1].data[0] = new Complex(0.5, 0.0);
       EigenVector[8][1].data[1] = new Complex(-root2inv, 0.0);
       EigenVector[8][1].data[2] = new Complex(0.5, 0.0);
       EigenVector[8][2].data[0] = new Complex(root2inv, 0.0);
       EigenVector[8][2].data[2] = new Complex(-root2inv, 0.0);
        
	//Sy Spin 1 matrix and eigenstates
       oper[9].data[0][1] = new Complex(0.0, -root2inv);
       oper[9].data[1][0] = new Complex(0.0, root2inv);
       oper[9].data[1][2] = new Complex(0.0, -root2inv);
       oper[9].data[2][1] = new Complex(0.0, root2inv); 
       EigenVector[9][0].data[0] = new Complex(0.5, 0.0);
       EigenVector[9][0].data[1] = new Complex(0.0, root2inv);
       EigenVector[9][0].data[2] = new Complex(-0.5, 0.0);
       EigenVector[9][1].data[0] = new Complex(0.5, 0.0);
       EigenVector[9][1].data[1] = new Complex(0.0, -root2inv);
       EigenVector[9][1].data[2] = new Complex(-0.5, 0.0);
       EigenVector[9][2].data[0] = new Complex(root2inv, 0.0);
       EigenVector[9][2].data[2] = new Complex(root2inv, 0.0);
    
       SetPhi(Math.PI/2.0, Math.PI/4.0);	//initializes operators 10 and 11 using 90 and 45 deg.
       for (int i=0; i<10; i++){
           opSquared[i] = oper[i].SquareMatrix();
       }
       

       for (int i=0; i<3; i++){
           for (int j=0; j<5; j++){
               InitialState[i][j] = new vector();
           }
       }
       /* This is where you want to make changes to initial states
	   For these Unknown states, the first index is sys, the second
	   labels the unknown state, and the third (on data) labels the row
	   */
       InitialState[0][0] = EigenVector[2][0];						// |+z>
       InitialState[0][1] = EigenVector[1][1];						// |-y>
       InitialState[0][2].data[0] = new Complex(root2inv, 0.0);			// |n> 90 deg, 240 deg
       InitialState[0][2].data[1] = new Complex(-root2inv/2.0, -root2inv/2.0*Math.sqrt(3.0));
       InitialState[0][3].data[0] = new Complex(0.5, 0.0);					// |n> 120 deg, 330 deg
       InitialState[0][3].data[1] = new Complex(0.75, -Math.sqrt(3.0)/4.0);
              
       InitialState[1][0] = EigenVector[9][0];						// |1y>
       InitialState[1][1].data[0] = new Complex(0.5,0.0);			// |1n> 90 deg, 60 deg
       InitialState[1][1].data[1] = new Complex(root2inv/2.0, root2inv/2.0*Math.sqrt(3.0));
       InitialState[1][1].data[2] = new Complex(-0.25, Math.sqrt(3.0)/4.0);
	   InitialState[1][2].data[0] = new Complex(1.0/Math.sqrt(3.0), 0.0);		// not a directional state
       InitialState[1][2].data[1] = new Complex(0.0, -1.0/Math.sqrt(3.0));
       InitialState[1][2].data[2] = new Complex(-1.0/Math.sqrt(3.0), 0.0);
       InitialState[1][3].data[0] = new Complex(root2inv, 0.0);					// |0n> 90 deg, 45 deg
       InitialState[1][3].data[1] = new Complex(0.0, 0.0);
       InitialState[1][3].data[2] = new Complex(0.0, -root2inv);

       InitialState[2][0] = InitialState[1][0];
       InitialState[2][1] = InitialState[1][1];
       InitialState[2][2] = InitialState[1][2];
       InitialState[2][3] = InitialState[1][3];
      
	  /*  This ype table associates Type Numbers (TypeNum) used in deviceSurface
	  to operator numbers (op) used here.  The first index is the system number, and the
	  second index is the TypeNum.  The right hand side is the op #
	  */
         typeTable[0][0] = 2;			//1/2 Sz
         typeTable[0][1] = 0;			//1/2 Sx
         typeTable[0][2] = 1;			//1/2 Sy
         typeTable[0][3] = 10;		//1/2 Sn
         typeTable[1][0] = 7;			//1 Sz
         typeTable[1][1] = 8;			//1 Sx
         typeTable[1][2] = 9;			//1 Sy
         typeTable[1][3] = 11;		//1 Sn
         typeTable[2][0] = 0;			//SU3
         typeTable[2][1] = 1;
         typeTable[2][2] = 2;
         typeTable[2][3] = 3;
         typeTable[2][4] = 4;
         typeTable[2][5] = 5;
         typeTable[2][6] = 6;
         typeTable[2][7] = 7;
   }
    
   /***********************************************************/
   /* set angles to new values and change operators and       */
   /* eigenvectors accordingly                                */
   /***********************************************************/
   public void SetPhi(double newTheta, double newPhi){
       
       setPhi(newTheta,newPhi);
       
       //Sn (theta,phi) Spin 1/2 Pauli matrix and eigenvectors
       oper[10].data[0][0] = new Complex(Math.cos(theta), 0.0);
       oper[10].data[0][1] = new Complex(Math.sin(theta) * Math.cos(phi), -Math.sin(theta) * Math.sin(phi));
       oper[10].data[1][0] = new Complex(Math.sin(theta) * Math.cos(phi), Math.sin(theta) * Math.sin(phi));
       oper[10].data[1][1] = new Complex(-Math.cos(theta), 0.0); 

       opSquared[10] = oper[10].SquareMatrix(); 

       EigenVector[10][0].data[0] = new Complex(Math.cos(theta/2.0), 0.0);
       EigenVector[10][0].data[1] = new Complex(Math.sin(theta/2.0)*Math.cos(phi), Math.sin(theta/2.0)*Math.sin(phi)); 
       EigenVector[10][1].data[0] = new Complex(Math.sin(theta/2.0), 0.0);
       EigenVector[10][1].data[1] = new Complex(-Math.cos(theta/2.0)*Math.cos(phi), -Math.cos(theta/2.0)*Math.sin(phi));
       
       //Sn (theta,phi) Spin 1 matrix and eigenvectors
       oper[11].data[0][0] = new Complex(Math.cos(theta), 0.0);
       oper[11].data[0][1] = new Complex(root2inv*Math.sin(theta)*Math.cos(phi), -root2inv*Math.sin(theta)*Math.sin(phi));
       oper[11].data[1][0] = new Complex(root2inv*Math.sin(theta)*Math.cos(phi), root2inv*Math.sin(theta)*Math.sin(phi));
       oper[11].data[1][2] = new Complex(root2inv*Math.sin(theta)*Math.cos(phi), -root2inv*Math.sin(theta)*Math.sin(phi)); 
       oper[11].data[2][1] = new Complex(root2inv*Math.sin(theta)*Math.cos(phi), root2inv*Math.sin(theta)*Math.sin(phi));
       oper[11].data[2][2] = new Complex(-Math.cos(theta), 0.0); 

       opSquared[11] = oper[11].SquareMatrix();

       EigenVector[11][0].data[0] = new Complex((1.0 + Math.cos(theta))*Math.cos(phi)/2.0, -(1.0 + Math.cos(theta))*Math.sin(phi)/2.0);
       EigenVector[11][0].data[1] = new Complex(root2inv * Math.sin(theta), 0.0);
       EigenVector[11][0].data[2] = new Complex((1.0 - Math.cos(theta))*Math.cos(phi)/2.0, (1.0 - Math.cos(theta))*Math.sin(phi)/2.0);
       EigenVector[11][1].data[0] = new Complex((1.0 - Math.cos(theta))*Math.cos(phi)/2.0, -(1.0 - Math.cos(theta))*Math.sin(phi)/2.0);
       EigenVector[11][1].data[1] = new Complex(-root2inv * Math.sin(theta), 0.0);
       EigenVector[11][1].data[2] = new Complex((1.0 + Math.cos(theta))*Math.cos(phi)/2.0, (1.0 + Math.cos(theta))*Math.sin(phi)/2.0);
       EigenVector[11][2].data[0] = new Complex(-root2inv * Math.sin(theta)*Math.cos(phi), root2inv * Math.sin(theta)*Math.sin(phi));
       EigenVector[11][2].data[1] = new Complex(Math.cos(theta), 0.0);
       EigenVector[11][2].data[2] = new Complex(root2inv * Math.sin(theta)*Math.cos(phi), root2inv * Math.sin(theta)*Math.sin(phi));
   }
    
    public deviceSurface getComponent(int i){
         return ((deviceSurface) components.elementAt(i));
    }

    public DrawLine getLine(int i){
         return ((DrawLine) lines.elementAt(i));
    }

    public void removeComponent(int i){
         components.remove(i);
    }
    
    public void removeLine(int i){
         lines.remove(i);
    }
    
    public void initialize(){
         components.removeAllElements();
         lines.removeAllElements();
    }
    
    public int sizeOfComponents(){
         return components.size();
    }
    
    public int sizeOfLines(){
         return lines.size();
    }

    public void addComponent(deviceSurface theO){
         components.add(theO);  
    }
    
    public void addLine(DrawLine thel){
         lines.add(thel);
    }
    
    /*************************************************************/
    /*exercise the experiment with the components drawn on screen*/
    /*************************************************************/
     public void start() {
          Spins.ath = new Thread(this);
          Spins.ath.start();
     }    

     public void pause() {
      	  Spins.ath = null;
     }
      
    private vector stateVector;//put it here because I want the change made to it in NextComp() is 
                //reflected to stateVector in move()
    //when go submenu is selected, the experiment runs continuously until stop submenu is selected. 
    private Random chance1 = new Random();
    public void run(){
        //this following one statement is programmed according to StartRunning() of original program
        ComputeUForMagnets();              

        Gun gun = null;
        deviceSurface theO;
        int indexOfGun = -1;
        
        for (int l=0; l<sizeOfComponents(); l++){
            theO = getComponent(l);
            if (theO instanceof Gun){
                if (getNextComponent(l, 0) != -1){
                   indexOfGun = l;
                   gun = (Gun) theO;
                   break;
                }
            }
        }
   
        if (gun == null){
            JOptionPane.showMessageDialog(Spins.sharedInstance(), "No atoms are fired to any counters!");
            Spins.goMenu.setEnabled(true);
            Spins.stopMenu.setEnabled(false);
            Spins.resetMenu.setEnabled(true);
                 if (Spins.watchIsTrue){
                    Spins.sharedInstance().enableDoMenus(false);
                 }
                 else{
                    Spins.sharedInstance().enableDoMenus(true);            
                 }
                 
                 Spins.watchMenu.setEnabled(true);            

            return;
        }
        
        int outputEnd;
        int current;
        int rand; //random number between 0 and (1 or 2);
        
        while (! Spins.stop){

            stateVector = new vector();//current state of system
            current = indexOfGun;
            theO = gun;
            outputEnd = 0;

            //the following part is programming according to DoOneAtom in original program             

            current = getNextComponent(current, outputEnd);
            if (current != -1){
               rand = chance1.nextInt(state);

               if (whichInit == 5){
                   //random initial state is chosen
                   if (system == 0){
                      stateVector = EigenVector[3-1][rand];
                   }
                   else {
                      stateVector = EigenVector[10-1][rand];
                   }
               }                
               else{
                   //unknown#1, unknown#2, or unknown#3, unknown#4, or unknown#5 is chosen
                   stateVector = InitialState[system][whichInit];
               }
               
               theO = getComponent(current);

               while (! (theO instanceof Counter)){
                   
                   current = NextComp(current);

                   if (current == -1){
                       break;
                   }
                   theO = getComponent(current);
               }
               if (current != -1){
                  ((Counter) theO).countIncreasedBy1();
                  Spins.sharedInstance().drawBoard.paintImmediately(Spins.sharedInstance().drawBoard.getBounds());
               }
            }
        }
    }
    
      //set field count to be 0 and field scale to be 1 in all Counter objects;
      public void clearCounters(){
	        deviceSurface theO;
 
	        for (int j=0; j<sizeOfComponents(); j++){
	            theO = getComponent(j);
	            Counter.initializeScale();
 
	            if (theO instanceof Counter){
	                ((Counter) theO).initializeCount();
	            }
	        }
      }	        
   
    private Random chance2 = new Random();
    //Given the component we're in and the state vector, roll the dice, slip the
    //vector into an eigenstate, and move on to the next component.  If it's a
    //magnet, multiply the state vector by the appropriate propagator and move on. 
    //added acording to NextComp() in original code
    //if you want to make drawn watch end stay a little bit longer or shorter, 
    //please go to Analyzer.java and change the watchTime.
    public int NextComp(int current){
        DrawLine line;
        deviceSurface theO = getComponent(current);
        if (theO instanceof Magnet){
            stateVector = ((Magnet) theO).getUMatrix().mvMul(stateVector);
            return getNextComponent(current, 0);
        }
        
        //if reach this point, theO could be only Analyzer
        int outputEnd = -1;
        int nextAt0;
        int nextAt1;
        int nextAt2;
        int next = -1;
        double rand;
        vector tempState;
        boolean TwoTheSame;
        double prob;

        if (state == 2){
            nextAt0 = getNextComponent(current,0);
            nextAt1 = getNextComponent(current,1);
            if (nextAt0 == nextAt1 && (! Spins.watchIsTrue)){
                return nextAt0;
            }
            else{
                rand = chance2.nextDouble();
                tempState = EigenVector[theO.getOp()][1-1];
                if (rand < stateVector.DotProdSquared(tempState)){
                    stateVector = tempState;
                    outputEnd = 0;
                    next = nextAt0;
                }
                else{
                    stateVector = EigenVector[theO.getOp()][2-1];
                    outputEnd = 1;
                    next = nextAt1;
                }
                 
                if (Spins.watchIsTrue){
                        Graphics g = (Graphics) Spins.drawBoard.getGraphics();
                      //g.translate(Spins.drawBoard.getInsets().left, Spins.drawBoard.getInsets().top);
                        ((Analyzer) theO).drawWatchEnd(g, outputEnd);
                      //g.translate(-Spins.drawBoard.getInsets().left, -Spins.drawBoard.getInsets().top);
                        g.dispose();
                        Spins.sharedInstance().drawBoard.paintImmediately(Spins.sharedInstance().drawBoard.getBounds());
                }
                
                return next;                                    
            }
        }
        else{ 
            //state = 3;
            
            int i = 1-1;
            int j = 2-1;
            int k = 3-1;

            nextAt0 = getNextComponent(current,0);
            nextAt1 = getNextComponent(current,1);
            nextAt2 = getNextComponent(current,2);
            TwoTheSame = false;
            
            //first determine if 2 or more of the pointers are the same
            if (nextAt0 == nextAt1 && (! Spins.watchIsTrue)){
                if (nextAt0 == nextAt2){
                    //all 3 output go to same place
                    return nextAt0;
                }
                
                i = 1-1;
                j = 2-1;
                k = 3-1;
                TwoTheSame = true;
            }
            
            if (nextAt0 == nextAt2 && (! Spins.watchIsTrue)){
                i = 1-1;
                j = 3-1;
                k = 2-1;
                TwoTheSame = true;
            }
            
            if (nextAt1 == nextAt2 && (! Spins.watchIsTrue)){
                i = 2-1;
                j = 3-1;
                k = 1-1;
                TwoTheSame = true;
            } 
            
            rand = chance2.nextDouble();
            tempState = EigenVector[theO.getOp()][k]; //k is the one that is different
            prob = stateVector.DotProdSquared(tempState);
            
            int temp;
            if (rand < prob){
                stateVector = tempState;
                temp = k;
            }
            else{
                if (TwoTheSame){
                    stateVector = tempState.ProjectOut(stateVector);
                    temp = i;
                }
                else{
                    tempState = EigenVector[theO.getOp()][j];
                    if ((rand - prob) < stateVector.DotProdSquared(tempState)){
                        stateVector = tempState;
                        temp = j;
                    }
                    else{
                        stateVector = EigenVector[theO.getOp()][i];
                        temp = i;
                    }
                }
            }
            if (temp == 0){
                           next = nextAt0;
                           outputEnd = 0;
            }
            else if (temp == 1){
                           next = nextAt1;
                           outputEnd = 1;
            }
            else if (temp == 2){
                           next = nextAt2;
                           outputEnd = 2;
            }                        
            if (Spins.watchIsTrue){
                            Graphics g = (Graphics) Spins.drawBoard.getGraphics();
                            //g.translate(Spins.drawBoard.getInsets().left, Spins.drawBoard.getInsets().top);
                            ((Analyzer) theO).drawWatchEnd(g, outputEnd);
                            //g.translate(-Spins.drawBoard.getInsets().left, -Spins.drawBoard.getInsets().top);
                            g.dispose();
                            Spins.sharedInstance().drawBoard.repaint();
            } 

            return next;                        
        }//end of Spin 1 section
    }

    //follow the end of component current and connected line, find the other connected end component.
    private int getNextComponent(int current, int outputEnd){
        DrawLine line = null;
        deviceSurface theO = getComponent(current);
        int next = -1;
        
        for (int l=0; l<sizeOfLines(); l++){
            if (getLine(l).Contains(current, outputEnd)){
                line = getLine(l);
                break;
            }
        }
        
        if (line != null){
            deviceSurface nextComponent = line.getEnd();
            
            for (int l=0; l<sizeOfComponents(); l++){
                if (getComponent(l).equals(nextComponent)){
                    next = l;
                    break;
                }
            }

        }
        
        return next;
    }
    
    //follow the end of component current and connected line, find the other connected end component.
    private int getPreviousComponent(int current){
        DrawLine line = null;
        int previous = -1;
        
        for (int l=0; l<sizeOfLines(); l++){
            if (getLine(l).Contains(current)){
                line = getLine(l);
                break;
            }
        }
        
        if (line != null){
            deviceSurface theO = line.getStart();
            
            for (int l=0; l<sizeOfComponents(); l++){
                if (getComponent(l).equals(theO)){
                    previous = l;
                    break;
                }
            }                                
        }
        
        return previous;
    }    
    
    //the value of system affects the value of state, op and type of Magnets and Analyzers.
    public void setSystem(int s){

        if (s ==0){
           if (system != 0){
           
              //a line out of middle output point of Analyzer has to be deleted.
              for (int i=0; i<sizeOfLines(); i++){
                  if (getLine(i).getStart() instanceof Analyzer && getLine(i).getOutputEnd() == 2){

                     for (int l=0; l<Spins.drawBoard.getComponentCount(); l++){
                                          if (Spins.drawBoard.getComponent(l) instanceof DrawLine){
                                              if (((DrawLine) Spins.drawBoard.getComponent(l)).equals(getLine(i))){
                                                  Spins.drawBoard.remove(l);
                                                  break;
                                              }
                                          }
                     }

                     removeLine(i);
                     i--;                     
                  }
              }
           }
           
           state = 2;
        }
        else{
           //if s = 2 or 1
           state = 3;
        }
        
        system = s;  
              
        //we also need to change the op value and type value in Analyzers and Magnets
        int op;
        String type;
        deviceSurface theO;
        for (int l=0; l<sizeOfComponents(); l++){
            theO = getComponent(l);
            op = 0; // for Guns and Counters, op has possible value of only 0
            type = null;
            if (theO instanceof Analyzer || theO instanceof Magnet){
                op = typeTable[system][0];
                if (s == 2){
                    type = "1";
                }
                else{
                    type = "Z";
                }

            }
            theO.setOp(op);
            theO.setType(type);
        }        
    }

    public int getSystem(){
        return system;
    }
    
    public int getState(){
        return state;
    }
    
    public void setWhichInit(int w){
        whichInit = w;
    }
    
    public int getWhichInit(){
        return whichInit;
    }
    
    public double getPhi(){
         return phi;
    }
    
    public void setPhi(double ntheta,double nphi){
         theta = ntheta;
         phi = nphi;
    }
    public void ComputeUForMagnets(){

        for (int i=0; i<sizeOfComponents(); i++){
            if (getComponent(i) instanceof Magnet){
                ((Magnet) getComponent(i)).ComputeU();
            }
        }
    }
    
    public int[] ComputeProbForCounters(){
        int [] indexOfCounters = new int [sizeOfComponents()];
        for (int i=0; i<sizeOfComponents(); i++){
            indexOfCounters[i] = -1;
        }
        
        int cCount = 0;
        for (int i=0; i<sizeOfComponents(); i++){
            if (getComponent(i) instanceof Counter){

                ComputeProb(i);
                indexOfCounters[cCount] = i;
                cCount++;
            }            
        }
        
        return indexOfCounters;
    }  
    
    //Given the index of a counter, compute the probability that an atom fired
    //from the gun will end up in that counter.
    //this is programmed according to ComputeProb of original program
    //Given the index of a counter, compute the probability that an atom fired
    //from the gun will end up in that counter. }

    private void ComputeProb(int cIndex){
        double result;
        double tempResult;
        int [] chain = new int [sizeOfComponents()]; //indices of components which atom
                                        //must pass through to get to counter.
        int chainLen;
        stateVector = new vector();
        int current, previous;
        int theLink;

        chain[0] = cIndex;
        current = cIndex;        
        chainLen = 1;
        
        while (true){
           
//??????????
//is there a bug in ComputeProb of original program? When it tries to get indices
//of components which atom must pass through to get to counter, only one inPtr is
//defaulted. The data structure of CompRec is also evident to this say.
//But I saw there are possiblites in which a component has two or more inPtr.

            previous = getPreviousComponent(current);
            if (previous == -1 || (getComponent(previous) instanceof Gun)){
                break;
            }
           
            current = previous;
            chain[chainLen] = current;
            chainLen++;                        
        }//we now have an array of all the components(including counter, excluding gun) leading to this counter.
        
        if (previous == -1){
            //if the top of the chain is not a Gun, this chain has a dead end
            ((Counter) getComponent(cIndex)).setProb(0.0);
            return;
        }
        
        deviceSurface theO;
        if (whichInit != 5){
            stateVector = InitialState[system][whichInit];
            result = 1.0;
            for (theLink=chainLen-1; theLink>0; theLink--){//chain[0] is the counter
                theO = getComponent(chain[theLink]);
                if (theO instanceof Magnet){
                    stateVector = ((Magnet) theO).getUMatrix().mvMul(stateVector);
                }
                else{
                    //theO is an Analyzer
                    result = result * BranchProb(chain[theLink], chain[theLink - 1]);
                }
            }
        }
        else{
            result = 0.0;
            if (system == 0){
                for (int i=0; i<2; i++){
                    stateVector = EigenVector[3-1][i];
                    tempResult = 1.0;
                    for (theLink=chainLen-1; theLink>0; theLink--){
                        theO = getComponent(chain[theLink]);
                        if (theO instanceof Magnet){
                            stateVector = ((Magnet) theO).getUMatrix().mvMul(stateVector);
                        }
                        else{
                            //theO is an Analyzer
                            tempResult = tempResult * BranchProb(chain[theLink], chain[theLink - 1]);
                        }
                    }
                    result = result + (tempResult/2.0);
                }
            }
            else{
                for (int i=0; i<3; i++){
                    stateVector = EigenVector[10-1][i];
                    tempResult = 1.0;
                    for (theLink=chainLen-1; theLink>0; theLink--){
                        theO = getComponent(chain[theLink]);
                        if (theO instanceof Magnet){
                            stateVector = ((Magnet) theO).getUMatrix().mvMul(stateVector);
                        }
                        else{
                            //theO is an Analyzer
                            tempResult = tempResult * BranchProb(chain[theLink], chain[theLink - 1]);
                        }                        
                    }
                    result = result + (tempResult/3.0);
                }
            }
        }
        ((Counter) getComponent(cIndex)).setProb(result);

    }
    
    //Assuming that one of the outputs of measurer start is connected to end,
    //compute the probability for the system to end up in end, given the
    //initial state.  Collapse the state appropriately.
    private double BranchProb(int start, int end){
        int temp,atTemp;
        double result;
        int nextAt0, nextAt1, nextAt2;
        int i,j,k, atI, atJ, atK;
        Analyzer comp1 = (Analyzer) getComponent(start);

        if (state == 2){     
            nextAt0 = getNextComponent(start, 0);
            nextAt1 = getNextComponent(start, 1);
            if (nextAt0 == nextAt1){
                result = 1.0;
            }
            else{
                if (nextAt0 == end){
                    result = stateVector.DotProdSquared(EigenVector[comp1.getOp()][1-1]);
                    stateVector = EigenVector[comp1.getOp()][1-1];
                }
                else{
                    result = stateVector.DotProdSquared(EigenVector[comp1.getOp()][2-1]);
                    stateVector = EigenVector[comp1.getOp()][2-1];
                }
            }
        }
        else{//i.e., if (state == 3)
            nextAt0 = getNextComponent(start, 0);
            nextAt1 = getNextComponent(start, 1);
            nextAt2 = getNextComponent(start, 2);
            if (nextAt0 == end){
                i = 0;
                j = 1;
                k = 2;
                atI = nextAt0;
                atJ = nextAt1;
                atK = nextAt2;
            }
            else if (nextAt1 == end){
                i = 1;
                j = 2;
                k = 0;
                atI = nextAt1;
                atJ = nextAt2;
                atK = nextAt0;            
            }
            else{//if (nextAt2 == end)
                i = 2;
                j = 0;
                k = 1;
                atI = nextAt2;
                atJ = nextAt0;
                atK = nextAt1;               
            }//now i points to end; j and k point to other 2 outputs.
            
            if (atK == end){
                //swap the value of k and j.
                temp = j;
                j = k;
                k = temp;
                
                atTemp = atJ;
                atJ = atK;
                atK = atTemp;
            }//now if 2 outputs go to end, they are i and j.
            
            if (atK == end){
                result = 1.0;
            }
            else{
                if (atJ == end){
                    result = 1.0 - stateVector.DotProdSquared(EigenVector[comp1.getOp()][k]);
                    stateVector = EigenVector[comp1.getOp()][k].ProjectOut(stateVector);
                }
                else{
                    result = stateVector.DotProdSquared(EigenVector[comp1.getOp()][i]);
                    stateVector = EigenVector[comp1.getOp()][i];
                }
            }
        }//end of "if (state == 2)....else"
        
        return result;
    }
    
    public static Experiment sharedInstance(){
        return instance;
    }
    
    public void setInstance(Experiment e){
        instance = e;
    }
    
    public int getWatchTime(){
    

        return watchTime;
    }
    
    public void setWatchTime(int i){
        watchTime = i;
    }

    //for data inputted from user in Unknown#5
    public void setInitialStateValue(int row, int column, vector value){
        InitialState[row][column] = value;
    }
    
    public vector getInitialStateValue(int index1, int index2){
        return InitialState[index1][index2];
    }

//added on 12/12
    public void switchIndex(int index1, int index2){
        //switch index between two objects in components vector
        Object theO1 = getComponent(index1);
        Object theO2 = getComponent(index2);
        components.setElementAt(theO2, index1);
        components.setElementAt(theO1, index2);
    }
} 

