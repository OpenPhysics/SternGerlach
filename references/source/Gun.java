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
 
public class Gun extends deviceSurface {
 
    public Gun() {
        setDimension( new Dimension(12*Spins.scal,12*Spins.scal) );
        setPosition( new Point(20+aRand.nextInt(50),20+aRand.nextInt(50)) );
        setClicked(false);
        setOp(0);//Gun has possible op value of only 0;
    }

    public void drawDevice(Graphics g) {
        //theP in the leftupper position of the object
        Point theP = getPosition();
        g.translate(theP.x, theP.y);
     
     if (getClicked()){
         drawGun(g, Color.lightGray);         
     }
     else{
         drawGun(g, Color.black);
     }
        g.translate(-theP.x, -theP.y); 
        g.dispose();      
    }
private void drawGun(Graphics g, Color cgun){
        Dimension theD = getDimension();
        int corner = theD.width/12;
       //draw outer rect
        g.setColor(cgun);
        g.drawRect(0, 0, theD.width/2, theD.height);
        
        //draw inner rect
		g.setColor(cgun);
        g.drawRect(corner, corner, theD.width/2-2*corner, theD.height-2*corner);
        
        //draw teeth        
        g.setColor(Color.white);
        g.fillRect(theD.width/2+theD.width/12, theD.height/4, theD.width/12, theD.height/2);
        g.fillRect(theD.width/2+theD.width*3/12, theD.height/4, theD.width/12, theD.height/2);
        g.fillRect(theD.width/2+theD.width*5/12, theD.height/4, theD.width/12, theD.height/2);
        g.setColor(cgun);
        g.drawRect(theD.width/2+theD.width/12, theD.height/4, theD.width/12, theD.height/2);
        g.drawRect(theD.width/2+theD.width*3/12, theD.height/4, theD.width/12, theD.height/2);
        g.drawRect(theD.width/2+theD.width*5/12, theD.height/4, theD.width/12, theD.height/2);
        g.drawLine(theD.width/2,theD.height/4,theD.width,theD.height/4);
        g.drawLine(theD.width/2,theD.height*3/4,theD.width,theD.height*3/4);
        g.setColor(Color.white);
        g.fillRect(theD.width/2-corner, theD.height*5/12, theD.width/2+corner+1, theD.height/6);
        g.setColor(cgun);
        g.drawLine(theD.width/4,theD.height/2,theD.width,theD.height/2);
}

   //the origin point is drawBoard.getInsets();
   //so the parameter value (x,y) should be the cursor_position - drawBoard.getInsets()
   public int getCursorType(int x, int y){
         Point theP =  getPosition();
         Dimension theD = getDimension();
         
         if (theP.x+theD.width/2 <= x && x <= theP.x+theD.width &&
             theP.y <= y && y <= theP.y+theD.height){
             return Cursor.E_RESIZE_CURSOR;
         }
         else if (theP.x <= x && x <= theP.x+theD.width &&
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
         Point theP = getPosition();
         Dimension theD = getDimension();
         
         if (theP.x+theD.width/2 <= x && x <= theP.x+theD.width &&
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
         //for a gun, there is no input
         return null;
   }
}
