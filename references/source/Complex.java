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
import java.io.*;

public class Complex {
    private double rPart;
    private double iPart;
    
    //cSet
    public Complex(double r, double i){
         rPart = r;
         iPart = i;
    }

    //rePart
    public double getRPart(){
         return rPart;
    }
    
    //imPart
    public double getIPart(){
         return iPart;
    }

    //cConj 
    public Complex conjugation(){
         return (new Complex(rPart,-iPart));
    }
    
    //cSum
    public Complex add(Complex theOther){
         double r = rPart + theOther.getRPart();
         double i = iPart + theOther.getIPart();
         return (new Complex(r,i));
    }
    
    //cDiff
    public Complex subtract(Complex theOther){
         double r = rPart - theOther.getRPart();
         double i = iPart - theOther.getIPart();
         return (new Complex(r,i));
    }

    //cProd
    public Complex product(Complex theOther){
         double r = rPart*theOther.getRPart() - iPart*theOther.getIPart();
         double i = iPart*theOther.getRPart() + rPart*theOther.getIPart();
         return (new Complex(r,i));
    }
    
    //csProd
    public Complex scale(double s){
         return (new Complex(rPart*s, iPart*s));
    }
    
    //cModSquared
    public double modSquared(){
         return rPart*rPart + iPart*iPart;
    }

    //cMod
    public double mod(){
         return Math.sqrt(modSquared());
    }
    
    //cQuot
    public Complex divide(Complex theOther){
         return product(theOther.conjugation()).scale(1/theOther.modSquared());
    }
    
    //cArg
    public double radiam(){
         if (rPart == 0.0){
             if (iPart == 0.0){
                 return 0.0/0.0;
             }
             else if (iPart > 0.0){
                 return Math.PI/2;
             }
             else{
                 return -Math.PI/2;
             }
         }
         else{
             return Math.atan(iPart/rPart);
         }
    }

    //debug    
    public void printComplex(){
                System.out.print(getRPart());
                System.out.print(" + ");
                System.out.print(getIPart());
                System.out.println(" i");    
    }
}
