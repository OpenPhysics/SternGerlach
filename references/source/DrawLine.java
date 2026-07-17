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
import java.awt.print.*;
import javax.swing.JPanel;
 
public class DrawLine extends JPanel{
    private deviceSurface startComponent;
    private int outputEnd;
    private deviceSurface endComponent;
    
    public DrawLine() {
 
        //do nothing
    }
    
    public void setStart(int current, int i){
 
        startComponent = Spins.anExperiment.getComponent(current);
        outputEnd = i;
    }
    
    public void setEnd(int current){
        endComponent = Spins.anExperiment.getComponent(current);
    }
    
    //check to see if the output end of theO has already had output
    public boolean Contains(int current, int i){

        if (startComponent.equals(Spins.anExperiment.getComponent(current)) && outputEnd == i){
            return true;
        }
        return false;
    }
    
    //check to see if theO has already had input 
    public boolean Contains(int current){
 
        if (endComponent.equals(Spins.anExperiment.getComponent(current))){
            return true;
        }
        return false;
    }

    public void paint(Graphics g){
        Point start = startComponent.getOutputPoint(outputEnd);
        Point end = endComponent.getInputPoint();
        g.setColor(Color.black);
        g.drawLine(start.x, start.y, end.x, end.y);
        g.dispose();
    }
    
    public deviceSurface getStart(){
        return startComponent;
    }
    
    public deviceSurface getEnd(){
        return endComponent;
    }
    
    public int getOutputEnd(){
        return outputEnd;
    }
}
