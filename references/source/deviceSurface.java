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
 
import java.awt.*;
import javax.swing.*;
import java.io.*;
import java.util.Random;
/**
 * All devices extend this deviceSurface Abstract class.  From
 * this class devices must implement the drawDevice method. 
 */
public abstract class deviceSurface extends JComponent implements Cloneable, Serializable {
    //leftUpper corner of an object
    public Point position;
    private String type;	//text printed in magnet and analyzers
    private Dimension dimension;
    private boolean clicked;
    private int op;		//operator index (0-11) used by magnets and analyzers
    
    static public Random aRand = new Random();

    public deviceSurface() {
        setDoubleBuffered(false);
    } 

    // ...demos that extend DemoSurface must implement this routine...
    public abstract void drawDevice(Graphics g);
  //public abstract void changeType();
    public abstract Point getOutputPoint(int output);
    public abstract Point getInputPoint();
    public abstract int getOutputEnd(int x, int y); 
  //public void incresedBy1();//only for Magnet
  //public which_HAND_CURSOR(int x, int y);//only for Magnet
  //public abstract void setState(int s);//only for Analyzer
    public abstract int getCursorType(int x, int y);

    public void paint(Graphics g) {
 
        Dimension d = getSize();
        //Graphics2D g2 = (Graphics2D) g;
        drawDevice(g);
        g.dispose();
    }

    public Point getPosition(){
        return position;
    }

    public void setPosition(Point a){
        position = a;
    }

    public void setDimension(Dimension d){
        dimension = d;
    }
        
    public Dimension getDimension(){
        return dimension;
    }

    public void setClicked(boolean b){
        clicked = b;
    }
 
    public boolean getClicked(){
        return clicked;
    }    
 
    public Object clone(){
        try{
            deviceSurface d = (deviceSurface) super.clone();
            d.position = (Point) position.clone();
            d.dimension = (Dimension) dimension.clone();
          //String is not implementing Cloneable
          //d.type = (String) type.clone();
            return d;
        }
        catch(CloneNotSupportedException e){
            //this shouldnot happen, since we are Cloneable
            return null;
        }
    }

    public Point getOffset(Point p){
        return (new Point(p.x - getPosition().x, p.y - getPosition().y));
    }
    

    public String getType(){
        return type;
    }
    //getTypeNum associates the label of an analyzer or magnet
    //with an orientation and then through typeTable in Experiment 
    //with an operator
    public int getTypeNum(){
        if (type.equals("X")){return 1;}
        else if (type.equals("Y")){return 2;}
        else if (type.equals("Z")){return 0;}
        else if (type.equals("n")){return 3;}
        else if (type.equals("1")){return 0;}
        else if (type.equals("2")){return 1;}
        else if (type.equals("3")){return 2;}
        else if (type.equals("4")){return 3;}                      
        else if (type.equals("5")){return 4;}
        else if (type.equals("6")){return 5;}
        else if (type.equals("7")){return 6;}
        else if (type.equals("8")){return 7;}  

        return -1;
    }
    
    public void setType(String t){
        type = t;
    }
    
    //the value of type affects the value of op.
    public void  changeType(){
      if (Experiment.sharedInstance().getSystem() != 2){

         //Spin 1/2 or Spin 1 is chosen
         if (getType().equals("X")){
             setType("Y");
         }
         else if (getType().equals("Y")){
             setType("Z");
         }
         else if (getType().equals("Z")){
             setType("n");
         }
         else if (getType().equals("n")){
             setType("X");
         }
      }
      else{
         //SU(3) is chosen
         //type changes from 1 to 8
         int typeInt = (new Integer(getType())).intValue();
         if (typeInt == 8){
             typeInt = 1;
         }
         else{
             typeInt++;
         }
         
         setType((new Integer(typeInt)).toString());
      }

      setOp(Experiment.typeTable[Experiment.sharedInstance().getSystem()][getTypeNum()]);      
    }
    

    public void setOp(int i){
        op = i;
    }
    
    public int getOp(){
        return op;
    }
}
