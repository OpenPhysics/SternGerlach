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
import javax.swing.*;
import javax.swing.event.*;
import javax.swing.border.*;
import java.awt.*;
import java.awt.event.*;
import java.util.*;
import java.io.*;
import java.applet.*;
import Spins;

public class SpinsApplet extends JApplet {
    
    public void init() {
        final Applet thisApplet = this;
        
        String vers = System.getProperty("java.version");
        if (vers.compareTo("1.1.2") < 0) {
            System.out.println("!!!WARNING: Swing must be run with a " +
                               "1.1.2 or higher version VM!!!");
        }
        
	// Force Spins to come up in the Cross Platform L&F
	try {
	    UIManager.setLookAndFeel(UIManager.getCrossPlatformLookAndFeelClassName());
	    // If you want the System L&F instead, comment out the above line and
	    // uncomment the following:
	    // UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
	} catch (Exception exc) {
	    System.err.println("Error loading L&F: " + exc);
	}
	 
        Spins sw = new Spins(thisApplet);
        getContentPane().setLayout(new BorderLayout());
        getContentPane().add(sw, BorderLayout.CENTER);
        validate();
        setVisible(true);        
        repaint();
        sw.requestDefaultFocus();  

    }
}
