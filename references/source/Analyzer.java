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
 
public class Analyzer extends deviceSurface {

    private final int UP = 0;
    private final int DOWN =1;
    private final int NONE = 2;

    
    public Analyzer() {

        setDimension( new Dimension(12*Spins.scal,12*Spins.scal) );
        setPosition( new Point(20+aRand.nextInt(50),20+aRand.nextInt(50)) );
        setClicked(false);
         
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
	     drawAnalyzer(g, Color.lightGray);
     }
     else{
	     drawAnalyzer(g, Color.blue);
     }
        g.translate(-theP.x, -theP.y); 
        g.dispose();     
    }

private void drawAnalyzer(Graphics g, Color canlz){
	Dimension theD = getDimension();
        int corner = theD.width/12 - 1;

        //set up main polygon
        int [] xPoints = new int[6];
        int [] yPoints = new int[6];
        xPoints[0] = corner;          yPoints[0] = 0;
        xPoints[1] = 0;               yPoints[1] = corner;
        xPoints[2] = 0;               yPoints[2] = theD.height-corner;
        xPoints[3] = corner;          yPoints[3] = theD.height;
        xPoints[4] = theD.width*2/3;  yPoints[4] = theD.height; 
        xPoints[5] = theD.width*2/3;  yPoints[5] = 0;
	
	//draw main polygon
        g.setColor(canlz);
        g.fillPolygon( new Polygon(xPoints, yPoints, 6) );        
        g.setColor(Color.black);
        g.drawPolygon( new Polygon(xPoints, yPoints, 6) );
       
        //draw inner oval
        g.setColor(Color.white);
        g.fillOval(theD.width/12, theD.height/6, theD.width/2, theD.height*2/3);
        g.setColor(Color.black);
        g.drawOval(theD.width/12, theD.height/6, theD.width/2, theD.height*2/3);

        //draw type inside oval
        g.setColor(Color.black);
        g.setFont(Spins.boldFont);
        if (getType().equals("n")){
           //draw a unit vector symbol
           g.drawString(getType(), theD.width/6+corner/2, theD.height*3/4-corner);
	   g.drawLine(theD.width/2, theD.height/3+corner, theD.width/3, theD.height/6+corner);
           g.drawLine(theD.width/6, theD.height/3+corner, theD.width/3, theD.height/6+corner);
        }
        else{
           g.drawString(getType(), theD.width/6+corner/4, theD.height*3/4-corner);
        }

        if (Experiment.sharedInstance().getState() == 3){
           drawArrow(g, UP, "black");
           drawArrow(g, DOWN, "black");
           drawArrow(g, NONE, "black");
        }
        else{
           drawArrow(g, UP, "black");
           drawArrow(g, DOWN, "black");
        }
}
    
   //the origin point is drawBoard.getInsets();
   //so the parameter value (x,y) should be the cursor_position - drawBoard.getInsets()
   public int getCursorType(int x, int y){
         Point theP =  getPosition();
         Dimension theD = getDimension();
 
         if (theP.x <= x && x <= theP.x+theD.width*2/3 &&
            theP.y+theD.height/3 <= y && y <= theP.y+theD.height*5/6){
            return Cursor.HAND_CURSOR;
         }
         else if (theP.x <=x && x <= theP.x+theD.width*2/3 &&
            theP.y <= y && y <= theP.y+theD.height){
            return Cursor.MOVE_CURSOR;
         }
         else if (theP.x+theD.width*2/3 <= x && x <= theP.x+theD.width &&
            theP.y <= y && y <= theP.y+theD.height){
            return Cursor.E_RESIZE_CURSOR;
         }
         
         return Cursor.getDefaultCursor().getType();  
   }

   //the origin point is drawBoard.getInsets();
   //so the parameter value (x,y) should be the cursor_position - drawBoard.getInsets()   
   //get the number of output by coordinate
   public int getOutputEnd(int x, int y){
         Point theP = getPosition();
         Dimension theD = getDimension();
           
         if (Experiment.sharedInstance().getState() == 3){
             if (theP.x+theD.width*2/3 <= x && x <= theP.x+theD.width &&
                 theP.y <= y && y <= theP.y+theD.height/3){
                 return UP;
             }
             else if (theP.x+theD.width*2/3 <= x && x <= theP.x+theD.width &&
                 theP.y+theD.height/3 <= y && y <= theP.y+theD.height*2/3){
                 return NONE;
             }
             else if (theP.x+theD.width*2/3 <= x && x <= theP.x+theD.width &&
                 theP.y+theD.height*2/3 <= y && y <= theP.y+theD.height){
                 return DOWN;
             }
         }
         else{
             if (theP.x+theD.width*2/3 <= x && x <= theP.x+theD.width &&
                 theP.y <= y && y <= theP.y+theD.height/2){
                 return UP;
             }
             else if (theP.x+theD.width*2/3 <= x && x <= theP.x+theD.width &&
                 theP.y+theD.height/2 <= y && y <= theP.y+theD.height){
                 return DOWN;
             }
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

         if (Experiment.sharedInstance().getState() == 3){
            switch(output){
               case UP: return (new Point(theP.x+theD.width, theP.y+theD.height/6));
               case NONE: return (new Point(theP.x+theD.width, theP.y+theD.height/2));
               case DOWN: return (new Point(theP.x+theD.width, theP.y+theD.height*5/6));
            }  
         }
         else{
            switch(output){
               case UP: return (new Point(theP.x+theD.width, theP.y+theD.height/4));
               case DOWN: return (new Point(theP.x+theD.width, theP.y+theD.height*3/4));
            }
         }
         return null;
   }
   
   public Point getInputPoint(){
         Dimension theD = getDimension();
         Point theP = getPosition();
         
         return (new Point(theP.x, theP.y+theD.height/2));
   }
   
   //attach a flash to the output end
   public void drawWatchEnd(Graphics g, int watchEnd){
         Point theP = getPosition();
         Dimension theD = getDimension();
         
         g.translate(theP.x, theP.y);
         
         if (getClicked()){
         
            if (Experiment.sharedInstance().getState() == 3){
              switch(watchEnd){
              case UP:
                     drawArrow(g, UP, "black");
                     break;
              case DOWN:
                     drawArrow(g, DOWN, "black");                     
                     break;  
              case NONE:
                     drawArrow(g, NONE, "black");
                     break;              
              default:
                     break;
              }
            }
            else{
              //state =2
              switch(watchEnd){
              case UP:
                     drawArrow(g, UP, "black");
                     break;
              case DOWN:                     
                     drawArrow(g, DOWN, "black");
                     break;
              default:
                     break;
              }              
            }         
         }
         else{
            if (Experiment.sharedInstance().getState() == 3){
              switch(watchEnd){
              case UP:
                     drawArrow(g, UP, "white");
                     break;
              case DOWN:
                     drawArrow(g, DOWN, "white"); 
                     break;
              case NONE:
                     drawArrow(g, NONE, "white");             
                     break;                  
              default:
                     break;
              }
            }
            else{
              //state =2
              switch(watchEnd){
              case UP:
                     drawArrow(g, UP, "white");
                     break;
                     
              case DOWN:
                     drawArrow(g, DOWN, "white");
                     break;
                  
              default:
                     break;
              }              
            }
         }
          
         g.translate(-theP.x, -theP.y); 
         try{Thread.sleep(Experiment.sharedInstance().getWatchTime());}catch(Exception e){}          
 
   }
   
   private void drawArrow(Graphics g, int direction, String bw){
         Point theP = getPosition();
         Dimension theD = getDimension();
	 Color back,arrow;
         int corner = theD.width/12 - 1;
         int s = Experiment.sharedInstance().getState();
	 if (bw.equals("white")){
		 arrow = Color.white;
		 back = Color.black;
	 }
	 else{
		 arrow = Color.black;
		 back = Color.white;
	 }
      //set up top polygon
        int [] axPoints = new int[6];
        int [] ayPoints = new int[6];
        axPoints[0] = theD.width*2/3;        ayPoints[0] = 0;
        axPoints[1] = theD.width-corner;     ayPoints[1] = 0;
        axPoints[2] = theD.width;            ayPoints[2] = corner;
        axPoints[3] = theD.width;            ayPoints[3] = theD.height/s-corner;
        axPoints[4] = theD.width-corner;     ayPoints[4] = theD.height/s; 
        axPoints[5] = theD.width*2/3;        ayPoints[5] = theD.height/s;
      //set up middle polygon
        int [] bxPoints = new int[6];
        int [] byPoints = new int[6];
        bxPoints[0] = theD.width*2/3;        byPoints[0] = theD.height/s;
        bxPoints[1] = theD.width-corner;     byPoints[1] = theD.height/s;
        bxPoints[2] = theD.width;            byPoints[2] = theD.height/s + corner;
        bxPoints[3] = theD.width;            byPoints[3] = 2*theD.height/s-corner;
        bxPoints[4] = theD.width-corner;     byPoints[4] = 2*theD.height/s; 
        bxPoints[5] = theD.width*2/3;        byPoints[5] = 2*theD.height/s;
      //set up bottom polygon
        int [] cxPoints = new int[6];
        int [] cyPoints = new int[6];
        cxPoints[0] = theD.width*2/3;        cyPoints[0] = theD.height - theD.height/s;
        cxPoints[1] = theD.width-corner;     cyPoints[1] = theD.height - theD.height/s;
        cxPoints[2] = theD.width;            cyPoints[2] = theD.height - theD.height/s+corner;
        cxPoints[3] = theD.width;            cyPoints[3] = theD.height -corner;
        cxPoints[4] = theD.width-corner;     cyPoints[4] = theD.height; 
        cxPoints[5] = theD.width*2/3;        cyPoints[5] = theD.height;

             switch(direction){
                case UP:
                     g.setColor(back);
                     g.fillPolygon( new Polygon(axPoints, ayPoints, 6) );        
                     g.setColor(Color.black);
                     g.drawPolygon( new Polygon(axPoints, ayPoints, 6) );
                     //draw up arrow
					 g.setColor(arrow);
                     g.drawLine(theD.width*5/6, theD.height/(2*s*(s+1)), theD.width*5/6, theD.height/(2*s*(s+1))+theD.height/(s+1));
                     g.drawLine(theD.width*5/6, theD.height/(2*s*(s+1)), theD.width*3/4, theD.height/s/2);
                     g.drawLine(theD.width*5/6, theD.height/(2*s*(s+1)), theD.width*11/12, theD.height/s/2);
              
                     break;    
                case NONE:
                     g.setColor(back);
                     g.fillPolygon( new Polygon(bxPoints, byPoints, 6) );        
                     g.setColor(Color.black);
                     g.drawPolygon( new Polygon(bxPoints, byPoints, 6) );
                     //draw o
					 g.setColor(arrow);
                     g.drawOval(theD.width*3/4, theD.height/s + corner, theD.width/5, theD.height/5); 
                 
                     break;
                case DOWN:
                     g.setColor(back);
                     g.fillPolygon( new Polygon(cxPoints, cyPoints, 6) );        
                     g.setColor(Color.black);
                     g.drawPolygon( new Polygon(cxPoints, cyPoints, 6) );
                     //draw down arrow
					 g.setColor(arrow);
                     g.drawLine(theD.width*5/6, theD.height-theD.height/(2*s*(s+1)), theD.width*5/6, theD.height- theD.height/(2*s*(s+1))-theD.height/(s+1));
                     g.drawLine(theD.width*5/6, theD.height-theD.height/(2*s*(s+1)), theD.width*3/4, theD.height- theD.height/s/2);
                     g.drawLine(theD.width*5/6, theD.height-theD.height/(2*s*(s+1)), theD.width*11/12, theD.height- theD.height/s/2);
                     break;
					 default:
                     break;
        }
   }
}
