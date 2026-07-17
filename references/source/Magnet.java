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
import java.lang.*; 
import java.awt.*;
 
public class Magnet extends deviceSurface implements Runnable{
    private int number=0;
    private Matrix UMatrix;

    public Magnet() {
        setDimension( new Dimension(12*Spins.scal,9*Spins.scal) );
        setPosition( new Point(20+aRand.nextInt(50),20+aRand.nextInt(50)) );
        setClicked(false);
        
        UMatrix = new Matrix();
        
        if (Experiment.sharedInstance().getSystem() == 2){
            setType("1");
        }
        else{
            setType("Z");
        }
                      
        setOp(Experiment.typeTable[Experiment.sharedInstance().getSystem()][getTypeNum()]);        
        
    }

    public void drawDevice(Graphics g) {

        //theP in the leftupper position of the object
        Point theP = getPosition();
        g.translate(theP.x, theP.y);
     
     if (getClicked()){
	     drawMagnet(g,Color.lightGray);
	}
	else{
	     drawMagnet(g,Color.red);
 	}	
        g.translate(-theP.x, -theP.y);   
        g.dispose();    
     } 
	
     private void drawMagnet(Graphics g, Color cmag){
	Dimension theD = getDimension();
        int horzcnr = theD.width/6;
        int vertcnr = theD.height/6;
	//draw outer round rect
        g.setColor(cmag);
        g.fillRoundRect(0, 0, theD.width, theD.height, horzcnr*2, vertcnr*2);
        
        //draw inner round rect
        g.setColor(Color.white);
        g.fillRoundRect(horzcnr/2-1, vertcnr, theD.width*3/8, theD.height*2/3, horzcnr, vertcnr);
 
        //draw type inside inner rect
        g.setColor(Color.black);
        g.setFont(Spins.boldFont);
        if (getType().equals("n")){
           //draw a unit vector
           g.drawString(getType(), horzcnr*3/4, theD.height*3/4);
		   g.drawLine(theD.width/4-horzcnr, theD.height/6+horzcnr, theD.width/4, theD.height/6);
           g.drawLine(theD.width/4+horzcnr, theD.height/6+horzcnr, theD.width/4, theD.height/6);
        }
        else{
           g.drawString(getType(), horzcnr/2, theD.height*3/4);
        }

        //draw number
        g.setColor(Color.white);
        g.setFont(Spins.smallFont);
        String aString = new String();
        if (number < 10){
           aString = "0";
        }
        aString = aString + Integer.toString(number);
        g.drawString(aString.substring(0,1), theD.width/2, theD.height*2/3);
        g.drawString(aString.substring(1,2), theD.width*3/4, theD.height*2/3);
    }

   //the origin point is drawBoard.getInsets();
   //so the parameter value (x,y) should be the cursor_position - drawBoard.getInsets()
   //If the size is changed, which_HAND_CURSOR() needs to be updated too.
   public int getCursorType(int x, int y){
         Point theP =  getPosition();
         Dimension theD = getDimension();
         
 
         if (theP.x <= x && x <= theP.x+theD.width*3/4 &&
            theP.y+theD.height/4 <= y && y <= theP.y+theD.height*3/4){
            return Cursor.HAND_CURSOR;
         }
         else if (theP.x+theD.width*3/4 <= x && x <= theP.x+theD.width &&
            theP.y <= y && y <= theP.y+theD.height){
            return Cursor.E_RESIZE_CURSOR;
         }         
         else if (theP.x <= x && x <= theP.x+theD.width &&
            theP.y <= y && y <= theP.y+theD.height){
            return Cursor.MOVE_CURSOR;
         }
         
         return Cursor.getDefaultCursor().getType();  
   }


   //the origin point is drawBoard.getInsets();
   //so the parameter value (x,y) should be the cursor_position - drawBoard.getInsets()   
   //get the number of output by coordinate
   public int getOutputEnd(int x, int y){
         Point theP = getPosition();
         Dimension theD = getDimension();
         
         if (theP.x+theD.width*3/4 <= x && x <= theP.x+theD.width &&
            theP.y <= y && y <= theP.y+theD.height){ 
             return 0;
         }
         return -1;
   }

   //the origin point is drawBoard.getInsets();
   //when use draw methods, the origin should be drawBoard.getInsets(),
   //so no extra operation is needed when use the return position to draw
   //get coordinate by the number of output
   public Point getOutputPoint(int output){
         Dimension theD = getDimension();
         Point theP = getPosition();
         if (output == 0){
            return (new Point(theP.x+theD.width, theP.y+theD.height/2));
         }
         return null;
   }
   
   public Point getInputPoint(){
         Dimension theD = getDimension();
         Point theP = getPosition();
         
         return (new Point(theP.x, theP.y+theD.height/2));
   }


   public void increasedBy1(){
         number++;
         if (number == 100){
             number = 0;
         }
   }
   
   //If the size is changed, method getCursorType() needs to be updated too. 
   public String which_HAND_CURSOR(int x, int y){
         Point theP = getPosition();
         Dimension theD = getDimension();
         if (theP.x <= x && x <= theP.x+theD.width*3/8 &&
            theP.y+theD.height/4 <= y && y <= theP.y+theD.height*3/4){
            return "leftOne";
         }
         else if (theP.x+theD.width*3/8 <=x && x <= theP.x+theD.width*3/4 &&
            theP.y+theD.height/4 <= y && y <= theP.y+theD.height*3/4){
            return "rightOne";
         }
         return null;  
   }

   private boolean pauseIsFalse ;
   private Thread b;
   public void run(){
         pauseIsFalse = true;
         while (pauseIsFalse){
             increasedBy1();
             Spins.drawBoard.repaint();             
             try{Thread.sleep(500);}
             catch(Exception e){}
         }
   }

   public void start(){
         b = new Thread(this);
         b.start();
   }
   
   public void pause(){
         number = number - 1; //to accomodate the delay between the time user wants to stop
                              // and the time she truly releases the mouse.
         pauseIsFalse = false;
         b = null;
   }
   
   public void setUMatrix(Matrix m){
         UMatrix = m;
   }
   
   public Matrix getUMatrix(){
         return UMatrix;
   }
   
   public boolean getPauseIsFalse(){
         return pauseIsFalse;
   }
   
  /***********************************************************************/
  /*Compute the propagator for a magnet component.  The formula is       */
  /*U = exp(iHt) = 1 - i*sin(phi)*H + (cos(phi)-1)*H^2.  It works for */
  /* any Hermitian matrix whose eigenvalues are entirely 1, 0, and/or -1.*/
  /***********************************************************************/
   public void ComputeU(){
         Matrix temp;//for storing intermediate results
         double phi = (2.0*Math.PI*number)/72.0;
         temp = Experiment.oper[getOp()].mMul(new Complex(0.0, -Math.sin(phi)));
         temp = temp.mAdd(Experiment.identity);
         UMatrix = Experiment.opSquared[getOp()].mMul(new Complex(Math.cos(phi) - 1.0, 0.0));
         UMatrix = temp.mAdd(UMatrix);
   }
}
