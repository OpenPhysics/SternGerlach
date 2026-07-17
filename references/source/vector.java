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
import java.io.*;

public class vector{
    public Complex[] data;

    public vector(){
        data = new Complex[3];
        
        //zero data
        for (int i=0; i<3; i++){
            data[i] = new Complex(0.0, 0.0);
        }
    }

    public Complex dotProduct(vector theOther){
        Complex result = new Complex(0,0);
        for (int i=0; i<Experiment.sharedInstance().getState(); i++){
            result = result.add(data[i].conjugation().product(theOther.data[i]));
        }
        return result;
    }

    public vector vMul(Complex theOther){
        vector result = new vector();
        for (int i=0; i<Experiment.sharedInstance().getState(); i++){
            result.data[i] = theOther.product(data[i]);
        } 
        return result;
    }

    public vector vAdd(vector theOther){
        vector result = new vector();
        for (int i=0; i<Experiment.sharedInstance().getState(); i++){
            result.data[i] = data[i].add(theOther.data[i]);
        }
        return result;
    }
    
    public vector normalize(){
        Complex temp = this.dotProduct(this);
        temp = new Complex(1.0/Math.sqrt(temp.getRPart()), 0.0);
        return vMul(temp);
    }
    
    public double DotProdSquared(vector theOther){
        Complex temp = this.dotProduct(theOther);
        return temp.modSquared();
    }

        /************************************************************/
        /* collapse the vector v2 into the plane perpendicular to v1*/
        /************************************************************/

	public vector ProjectOut (vector v2){
	      Complex z = dotProduct(v2);
	      z = z.scale(-1.0);
	      vector temp = vMul(z);
	      v2 = temp.vAdd(v2);
	      v2.normalize();
	      return v2;
	}

    //for debug
    public void printVector(){

            for (int j=0; j<3; j++){
                System.out.print("data[");
                System.out.print(j);
                System.out.print("] = ");                
                data[j].printComplex();
            }
    }
}
