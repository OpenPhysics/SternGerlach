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

public class Matrix {
    public Complex[][] data;
    
    public Matrix(){
        data = new Complex [3][3];
        
        //zero data
        for (int i=0; i<3; i++){
            for (int j=0; j<3; j++){
                data[i][j] = new Complex(0.0, 0.0);
            }
        }
    }

    public Matrix mAdd(Matrix theOther){
        Matrix result = new Matrix();
        
        for (int i=0; i<Experiment.sharedInstance().getState(); i++){
            for (int j=0; j<Experiment.sharedInstance().getState(); j++){
                result.data[i][j] = data[i][j].add(theOther.data[i][j]);
            }
        }
        return result;
    }
    
    public Matrix mMul(Complex theOther){
        Matrix result = new Matrix();
        
        for (int i=0; i< Experiment.sharedInstance().getState(); i++){
            for (int j=0; j<Experiment.sharedInstance().getState(); j++){
                result.data[i][j] = theOther.product(data[i][j]);
            }
        }
        return result;
    }

    public vector mvMul(vector theOther){
        vector result = new vector();
        
        for (int i=0; i<Experiment.sharedInstance().getState(); i++){
            for (int j=0; j<Experiment.sharedInstance().getState(); j++){
                result.data[i] = result.data[i].add(theOther.data[j].product(data[i][j]));
            }
        }
        return result;
    }

    public Matrix SquareMatrix(){

        Matrix result = new Matrix();

        for (int i=0; i<3; i++){
            for (int j=0; j<3; j++){
                for (int k=0; k<3; k++){
                    result.data[i][j] = result.data[i][j].add(data[i][k].product(data[k][j]));
                }
            }
        }
        return result;
    }


    // for debug
    public void printMatrix(){
        for (int i=0; i<3; i++){
            for (int j=0; j<3; j++){
                System.out.print("data[");
                System.out.print(i);
                System.out.print("][");
                System.out.print(j);
                System.out.print("] = ");
                
                data[i][j].printComplex();
            }
        }           
    }
}
