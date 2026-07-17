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
 
public class Counter extends deviceSurface {
    //record how many atoms the counter has received;
    private int count=0;
    //counter display scale.
public static int scale=1;
    private double prob;

    public Counter() {
        setDimension( new Dimension(100,10) );
        setPosition( new Point(20+aRand.nextInt(50),20+aRand.nextInt(50)) );
        setClicked(false);
        setOp(0);//op has possible value of only 0; 
        prob = 0.0;
    }

    public void drawDevice(Graphics g) {
        //theP in the leftupper position of the object
        Point theP = getPosition();
        g.translate(theP.x, theP.y);
     
     if (getClicked()){
	     drawCounter(g, Color.lightGray);
     }
     else{
	     drawCounter(g, Color.black);
     }
        g.translate(-theP.x, -theP.y); 
        g.dispose();      
    }
    
    private void drawCounter(Graphics g, Color colcount){
	Dimension theD = getDimension();
	g.setColor(colcount);
        //draw outer rect
        g.drawRect(0, 0, theD.width, theD.height);
            
        while ((int)(count/scale) >= 100){
            scaleDown();      
        }
        //draw the counter display
        g.fillRect(0, 0, (int)(count/scale), theD.height);
        //draw the number
        g.setFont(Spins.boldFont);
        g.drawString(Integer.toString(count), theD.width/4, theD.height+6*Spins.scal);
    }
    
    //cut the counter display scale into half;
    private void scaleDown(){
        scale = scale*2;
    }
    
   //the origin point is drawBoard.getInsets();
   //so the parameter value (x,y) should be the cursor_position - drawBoard.getInsets()
   public int getCursorType(int x, int y){
         Point theP =  getPosition();
         Dimension theD = getDimension();
         
         if (theP.x <= x && x <= theP.x+theD.width &&
             theP.y <= y && y <= theP.y+theD.height){
             return Cursor.MOVE_CURSOR;
         }
         return Cursor.getDefaultCursor().getType();  
   }
   
   public void changeType(){
         //do nothing
   }

   //the origin point is drawBoard.getInsets();
   //so the parameter value (x,y) should be the cursor_position - drawBoard.getInsets()   
   //get the number of output by coordinate
   public int getOutputEnd(int x, int y){
         //no outputEnd for a Counter
         return -1;
   }

   //the origin point is drawBoard.getInsets();
   //when use draw methods, the origin should be drawBoard.getInsets(),
   //so no extra operation is needed when use the return position to draw
   //get coordinate by the number of output
   public Point getOutputPoint(int output){
         //no output for a Counter
         return null;
   }
   
   public Point getInputPoint(){
         Point theP = getPosition();
         Dimension theD = getDimension();
         
         return (new Point(theP.x, theP.y+theD.height/2));
   }

   public void countIncreasedBy1(){
         count++;
   }
   
   public void initializeCount(){
         count = 0;
   }
   
   public static void initializeScale(){
         scale = 1;
   }
   
   public void ComputeProb(){
   }
   
   public double getProb(){
         return prob;
   }
   
   public void setProb(double d){
         prob = d;
   }
   
   public int getCount(){
         return count;
   }
}
