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

/*
 * Swing componets for Spins
 * version 3.01
 *  by: Lichun Jia
 *        David H. McIntyre
 * December 2002
 */

import javax.swing.*;
import javax.swing.event.*;
import javax.swing.text.*;
import javax.swing.border.*;
import javax.swing.filechooser.*;
import javax.accessibility.*;
import javax.swing.JTable;
import javax.swing.table.AbstractTableModel;
import javax.swing.DefaultCellEditor;
import javax.swing.SwingUtilities;
import javax.swing.plaf.basic.BasicInternalFrameTitlePane;
import java.text.ParseException;
import java.text.NumberFormat;
import java.awt.*;
import java.awt.event.*;
import java.awt.Toolkit;
import java.beans.*;
import java.util.*;
import java.io.*;
import java.applet.*;
import java.net.*;

public class Spins extends JPanel implements MouseListener, MouseMotionListener{

    // This
    Spins spinsobj;

    // The Frame
    public static JFrame frame;
    public static Experiment anExperiment; 
    public static JPanel drawBoard;
    private final static Color backgroundColor = Color.white;
    public static boolean stop;    
    //a thread running in run of Experiment.java
    public static Thread ath;
 
    //set the initial value of watch is false. This is effective to drawDevice method in deviceSurface
    public static boolean watchIsTrue = false;

    //initializer submenu items in Control menu
    public static JMenuItem goMenu = new JMenu();
    public static JMenuItem stopMenu = new JMenu();
    public static JMenuItem resetMenu = new JMenu();
    public static JMenuItem sleepMenu = new JMenu();
    public static JMenuItem do1Menu = new JMenu();
    public static JMenuItem do2Menu = new JMenu();
    public static JMenuItem do3Menu = new JMenu();
    public static JMenuItem do4Menu = new JMenu();
    public static JMenuItem do5Menu = new JMenu();
    public static JMenuItem watchMenu = new JMenu();
    
    // The width and height of the frame
    public static int WIDTH = 800;
    public static int HEIGHT = 600;

    public static int preferredWIDTH = 800;
    public static int preferredHEIGHT = 600;
  
    public final static Border emptyBorder0= new EmptyBorder(0,0,0,0);
    public final static Border emptyBorder10= new EmptyBorder(10,10,10,10);
    public final static Border loweredBorder = new SoftBevelBorder(BevelBorder.LOWERED);

    //scal sets the scale for each drawn component
    public static int scal = 6;

    public static Font smallFont = new Font("Arial", Font.PLAIN, 5*scal);
    public static Font defaultFont = new Font("Dialog", Font.PLAIN, 12);
    public static Font boldFont = new Font("Arial", Font.PLAIN, 6*scal);

    public static char basis = 'Z';//basis can be X,Y or Z. Its value is defined in getDataFromUser()

    // This != null if we are an applet
    java.applet.Applet applet;
    static Spins instance;

    public Spins() {
       //the following is equivalent to Spins(null);
	this(null);
    }

    /*******************************************/
    /******   Constructor for Spins    ********/
    /*******************************************/
    public Spins(java.applet.Applet anApplet) {

	super(true); // double buffer

	instance = this;
	applet = anApplet;
 
	spinsobj = this;
    anExperiment = new Experiment();

	setName("main Spins panel");
	setFont(defaultFont);
	setLayout(new BorderLayout());
           
	// Add a MenuBar
        //menus created in createMenuBar won't be shown until in main when frame.setSize is encountered.
	add(createMenuBar(), BorderLayout.NORTH);
	add(createToolBar(), BorderLayout.CENTER);

        //build a simple sample experiment inside the program.
        buildSampleExperiment();
    }
    
    private void buildSampleExperiment(){
        //make vectors in anExperiment empty.
        clearAll();

        Rectangle drawBoardBounds = drawBoard.getBounds();

        Gun theO1 = new Gun();
        theO1.setPosition(new Point(100,200));
        theO1.setBounds(drawBoardBounds);
        anExperiment.addComponent(theO1);
        drawBoard.add(theO1);//this is where the paint method is invoked

        Analyzer theO2 = new Analyzer();
        theO2.setPosition(new Point(100+25*scal,200));
        theO2.setBounds(drawBoardBounds);
        anExperiment.addComponent(theO2);
        drawBoard.add(theO2);//this is where the paint method is invoked
        
        Counter theO3 = new Counter();
        theO3.setPosition(new Point(100+50*scal,200-6*scal));
        theO3.setBounds(drawBoardBounds);
        anExperiment.addComponent(theO3);
        drawBoard.add(theO3);//this is where the paint method is invoked
        
        Counter theO4 = new Counter();
        theO4.setPosition(new Point(100+50*scal,200+17*scal));
        theO4.setBounds(drawBoardBounds);
        anExperiment.addComponent(theO4);
        drawBoard.add(theO4);//this is where the paint method is invoked
        
        //draw lines between components
        
        DrawLine line1 = new DrawLine();
        line1.setBounds(drawBoardBounds);
        line1.setStart(0,0);
        line1.setEnd(1);
        anExperiment.addLine(line1);
        drawBoard.add((DrawLine) line1);

        DrawLine line2 = new DrawLine();
        line2.setBounds(drawBoardBounds);
        line2.setStart(1,0);
        line2.setEnd(2);
        anExperiment.addLine(line2);
        drawBoard.add((DrawLine) line2);

        DrawLine line3 = new DrawLine();
        line3.setBounds(drawBoardBounds);
        line3.setStart(1,1);
        line3.setEnd(3);
        anExperiment.addLine(line3);
        drawBoard.add((DrawLine) line3);
        
        try{drawBoard.paintAll(drawBoard.getGraphics());}
        catch(Exception e){}
        drawBoard.repaint();        
    }
 
   private boolean isDrawingLine = false;
   
   public int find(int x, int y)
   {
      if (anExperiment.sizeOfComponents() <=0){
            return -1;
      } 

      Point theP;
      Dimension theD;
      Insets theI = drawBoard.getInsets();
      for (int i = 0; i < anExperiment.sizeOfComponents(); i++)
	  {
         theP = anExperiment.getComponent(i).getPosition();
         theD = anExperiment.getComponent(i).getDimension();
         
         if (theP.x + theI.left <= x && x <= theP.x + theD.width + theI.left &&
             theP.y + theI.top <= y && y <= theP.y + theD.height + theI.top)
         {
            return i;
         } 
      }
      return -1;
   }

   public void mouseClicked(MouseEvent evt) 
   {  
      Point theCursor = new Point(evt.getX(), evt.getY());

      int current = find(theCursor.x, theCursor.y);
 
      if (current < 0) // not inside a object
      {  //do nothing
         return;
      }

      Point adjusted = adjust(theCursor);      

      //Set theO to the component in which the cursor resides
      deviceSurface theO = anExperiment.getComponent(current);

      if (evt.getClickCount() >= 2)	//double click selects component
      {
           theO.setClicked(! theO.getClicked());
	   for (int i=0; i<anExperiment.sizeOfComponents(); i++)
	   {
		   if (theO != anExperiment.getComponent(i))
		   {
			   anExperiment.getComponent(i).setClicked(false);
		   }
	   }
      }
      else if (theO.getCursorType(adjusted.x, adjusted.y) == Cursor.HAND_CURSOR &&
          evt.getClickCount() ==1 )	//single click changes type or adds to B
	  {
          
          if (theO instanceof Magnet)
	  {
             //Magnet has two places to show HAND_CURSOR
              if (((Magnet) theO).which_HAND_CURSOR(adjusted.x, adjusted.y).equals("rightOne"))
	      {
                 ((Magnet) theO).increasedBy1();                 
              }
              else
	      {
                 theO.changeType();              
              }
          }
          else
	  {
             //Analyzer has only one HAND_CURSOR
             theO.changeType();
          }
      } 

      drawBoard.repaint();
   }
 
   public void mouseMoved(MouseEvent evt) 
   {  
      Point theCursor = new Point(evt.getX(), evt.getY());

      int current = find(theCursor.x,theCursor.y);

      if (current >= 0) {
         Insets theI = drawBoard.getInsets();
         Point adjusted = adjust(theCursor);
         deviceSurface theO = anExperiment.getComponent(current);

         drawBoard.setCursor(new Cursor(theO.getCursorType(adjusted.x, adjusted.y)));
      }
      else{
         drawBoard.setCursor(Cursor.getDefaultCursor());
      }
   }

    //variables to help drawing lines   
    private Point p1 = new Point();
    private Point p2 = new Point();
    private Point ptemp = new Point();
    private DrawLine line;
    private Point offset = new Point();
    private int cursorTypeWhenPressed;
    //to prevent moving another object when one object is dragged through it
    private int currentPressed;
    
   public void mouseDragged(MouseEvent evt) 
   {
      if (! isDrawingLine)
	  {
          Point theCursor = new Point(evt.getX(), evt.getY());    
          //int current = find(theCursor.x, theCursor.y);
 
          if (currentPressed >= 0){
             deviceSurface theO = anExperiment.getComponent(currentPressed);

             Point adjusted = adjust(theCursor);
             if (cursorTypeWhenPressed == Cursor.MOVE_CURSOR){
 
                //I make the drawBoard size explicitly of (preferredWIDTH, preferredHEIGHT), so the scroll 
                //bar will work as long as the drawn component is within the preferred area. 
                //To make it more robust, no moved components coordinate is allowed beyound the preferred area.
                //Checking for the moved components coordinate is needed here.
                if (adjusted.x+theO.getDimension().width-offset.x < preferredWIDTH && adjusted.y+theO.getDimension().height-offset.y < preferredHEIGHT
                    && adjusted.x-offset.x > drawBoard.getInsets().left && adjusted.y-offset.y > drawBoard.getInsets().top){
                     //the object is dragged to new position
                     //we need the adjusted position to be the center position of an object.
                     theO.setPosition(new Point(adjusted.x - offset.x, adjusted.y - offset.y)); 
                }
             }
          }     
      }
      else{

          //isDrawingLine is true
            evt.consume();
            ptemp = p2;
            p2 = new Point(evt.getX(), evt.getY());
 
            Graphics g = drawBoard.getGraphics();
	    g.setColor(Color.black);
	    Insets theI = drawBoard.getInsets();
	    
	    //if we draw here, the dimension does include drawBoard.getInsets()
	    //if we use drawBoard.add(), the dimension doesnot include drawBoard.getInsets()
	    if (p2.x != -1) {

		g.drawLine(p1.x+theI.left, p1.y+theI.top, p2.x, p2.y);
                try{Thread.sleep(10);}
                catch(Exception e){}
	    }
	    else{
	        if (ptemp.x != -1) {

		    g.drawLine(p1.x+theI.left, p1.y+theI.top, ptemp.x, ptemp.y);
                    try{Thread.sleep(10);}
                    catch(Exception e){}
      	        }
	    }
	    g.dispose();
      }
      drawBoard.repaint();     
   }

   private Point adjust(Point p){
      //the object is dragged to new position
      //when you draw a object, the origin is the left and top corner of draw panel.

        int x = p.x - drawBoard.getInsets().left;
        int y = p.y - drawBoard.getInsets().top;
        return (new Point(x,y));
   }
   
  private boolean numIsIncreasing = false; //increase the number of magnet   
  public void mousePressed(MouseEvent e){
        e.consume();
        Point theCursor = new Point(e.getX(), e.getY());
        int current = find (theCursor.x, theCursor.y);
        if (current < 0){
            currentPressed = -1;
            return;
        }      
        
        deviceSurface theO = anExperiment.getComponent(current);
        Point adjusted = adjust(theCursor);
        int outputEnd = theO.getOutputEnd(adjusted.x, adjusted.y);

        if (outputEnd < 0){
            offset = theO.getOffset(adjusted);
            currentPressed = current;
            cursorTypeWhenPressed = theO.getCursorType(adjusted.x, adjusted.y);

            if (cursorTypeWhenPressed == Cursor.HAND_CURSOR && theO instanceof Magnet){
               if (((Magnet) theO).which_HAND_CURSOR(adjusted.x, adjusted.y).equals("rightOne")){
                  numIsIncreasing = true;
                  ((Magnet) theO).start();
               }      
            }
            return;
        }
        else{
            for (int i=0; i<anExperiment.sizeOfLines(); i++){
 
                if (anExperiment.getLine(i).Contains(current, outputEnd)){

                    for (int l=0; l<drawBoard.getComponentCount(); l++){
                        if (drawBoard.getComponent(l).equals(anExperiment.getLine(i))){
                           drawBoard.remove(l);
                           //l--;
                           break;
                        }
                    }
                    anExperiment.removeLine(i);
                    break;
                }
            }
            isDrawingLine = true; 
            line = new DrawLine();
 
            p1 = theO.getOutputPoint(outputEnd);
            p2.x = -1;
            line.setStart(current, outputEnd);
        }
  }
  
  public void mouseReleased(MouseEvent e) {
        Point theCursor = new Point(e.getX(), e.getY());

        if (isDrawingLine){
           e.consume();
           int current = find(theCursor.x, theCursor.y);
           if (current >= 0){
               
               //check if it is a connect paths from two different components to the same third component.
               boolean endConnectedToAnother = false;
               deviceSurface start = line.getStart();
               deviceSurface end = anExperiment.getComponent(current);
               DrawLine temp;
               for (int i=0; i<anExperiment.sizeOfLines(); i++){
                   temp = anExperiment.getLine(i);
                   if (temp.getEnd().equals(end) && ! temp.getStart().equals(start)){
                       endConnectedToAnother = true;
                       break;
                   }
               }
               
               if (endConnectedToAnother){
                  //Do not allow users to connect paths from two different components to the same third component.               
                  //do nothing.
               }
               else if (start.equals(end)){
                  //if the start of line is the same with the end of line, ignor it.  
                  //do nothing.              
               }     
               else{
                  if (! (anExperiment.getComponent(current) instanceof Gun)){
                     line.setEnd(current);

                     line.setBounds(drawBoard.getBounds());        
                     anExperiment.addLine(line);
                     drawBoard.add((DrawLine) line);
          
                     try{drawBoard.paintAll(drawBoard.getGraphics());}
                     catch(Exception e2){}
                     drawBoard.repaint();
                  }
               }              
           }
           p2.x = ptemp.x = -1;
           isDrawingLine = false;
        }
        else{

           cursorTypeWhenPressed = Cursor.getDefaultCursor().getType();

           //Since any one of magents running method run() causes numIsIncreasing to be true,
           //we need to find the one who started its run() and stop it.
           if (numIsIncreasing){
               deviceSurface theO;
               for (int i=0; i<anExperiment.sizeOfComponents(); i++){
                   theO = anExperiment.getComponent(i);
                   if (theO instanceof Magnet){
                       if (((Magnet) theO).getPauseIsFalse()){

                           ((Magnet) theO).pause();
                           numIsIncreasing = false;
                           setCursor(Cursor.getPredefinedCursor(Cursor.DEFAULT_CURSOR));
                           break;
                       }                      
                   }
               }
           }
           drawBoard.repaint();
        }                
  }
  
    public void mouseEntered(MouseEvent e) {
    }

    public void mouseExited(MouseEvent e) {
    }
 
    /*******************************************/
    /************ create menus ************/
    /*******************************************/

    JDialog aboutBox;

    //put these menu items as globals because we want to selecte
    // or disselecte menu items from another method displayFile().
    JMenuItem state2MenuItem, state3MenuItem, su3MenuItem;
    JMenuItem unknown1MenuItem, unknown2MenuItem, unknown3MenuItem, unknown4MenuItem, unknown5MenuItem, randomMenuItem;
    JMenuItem redrawMenuItem;
  
    JMenuBar createMenuBar() {
	// MenuBar
        JPopupMenu.setDefaultLightWeightPopupEnabled(false);	
	JMenuBar menuBar = new JMenuBar();
	
	menuBar.getAccessibleContext().setAccessibleName("Spins menus");

	JMenuItem mi;

	// File Menu
	JMenu file = (JMenu) menuBar.add(new JMenu("File"));
        file.setMnemonic('F');
	file.getAccessibleContext().setAccessibleDescription("The standard 'File' application menu");

        mi = (JMenuItem) file.add(new JMenuItem("About"));
        mi.setMnemonic('A');
	mi.getAccessibleContext().setAccessibleDescription("Find out something about the Spins application");
	mi.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
                if(aboutBox == null) {
                    aboutBox = new JDialog(Spins.sharedInstance().getFrame(), "About SPINS", false);
                    JPanel groupPanel = new JPanel(new BorderLayout());
		    URL urlabout = Spins.class.getResource("images/aboutSpins.gif");
                    ImageIcon groupPicture = new ImageIcon(urlabout,"Spins about box");
                    aboutBox.getContentPane().add(groupPanel, BorderLayout.CENTER);
                    JLabel groupLabel = (new JLabel(groupPicture));
                    groupPanel.add(groupLabel, BorderLayout.CENTER);
                    JPanel buttonPanel = new JPanel(true);
                    groupPanel.add(buttonPanel, BorderLayout.SOUTH);
                    JButton button = (JButton) buttonPanel.add(new JButton("OK"));
                    button.addActionListener(new ActionListener() {
                        public void actionPerformed(ActionEvent e) {
                            aboutBox.setVisible(false);
                        }
                    });
                }
                aboutBox.pack();
                aboutBox.show();
	    }
	});

        file.addSeparator();
        
        mi = (JMenuItem) file.add(new JMenuItem("New"));
        mi.setMnemonic('N');
	mi.getAccessibleContext().setAccessibleDescription("Create a new file"); 
	mi.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
               clearAll();
               anExperiment.setWhichInit(0);
               initialMenuBarStatus();              
               Spins.sharedInstance().drawBoard.paintImmediately(Spins.sharedInstance().drawBoard.getBounds());
	    }
	});
 
        file.addSeparator();

        mi = (JMenuItem) file.add(new JMenuItem("Default Experiment"));
        mi.setMnemonic('D');
	mi.getAccessibleContext().setAccessibleDescription("get the sample experiment");
        mi.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_D, ActionEvent.CTRL_MASK));
        mi.addActionListener(new ActionListener() {
   	     public void actionPerformed(ActionEvent e) {
   	         clearAll();

                 initialMenuBarStatus();
                 buildSampleExperiment();
             }        
        });        

        file.addSeparator();

        mi = (JMenuItem) file.add(new JMenuItem("Quit"));
        mi.setMnemonic('Q');
	mi.getAccessibleContext().setAccessibleDescription("Exit the Spins application");
        mi.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_Q, ActionEvent.CTRL_MASK));
	mi.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
		System.exit(0);
	    }
	}
	);

	// Edit Menu
	JMenu edit = (JMenu) menuBar.add(new JMenu("Edit"));
        edit.setMnemonic('E');        
	edit.getAccessibleContext().setAccessibleDescription("Edit a experiment");
 
        mi = (JMenuItem) edit.add(new JMenuItem("Cut"));
        mi.setMnemonic('u');
	mi.getAccessibleContext().setAccessibleDescription("Cut the selected component");
	mi.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
	        cutAction();
	    }
	});

        mi = (JMenuItem) edit.add(new JMenuItem("Copy"));
        mi.setMnemonic('o');
	mi.getAccessibleContext().setAccessibleDescription("Copy the selected component");
	mi.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
	         if (anExperiment.sizeOfComponents() <=0)
	            return;
	            
                 deviceSurface clone;
                 for (int i=0; i<anExperiment.sizeOfComponents(); i++){

                     if (anExperiment.getComponent(i).getClicked()){
                     
                         anExperiment.getComponent(i).setClicked(false);
                         clone = (deviceSurface) anExperiment.getComponent(i).clone();

                         ((Point) clone.getPosition()).translate(0,50);

                         anExperiment.addComponent(clone);
                         drawBoard.add((deviceSurface) clone);
                     }
                 }
                 drawBoard.repaint();
       	    }
	});

        edit.addSeparator();
        mi = (JMenuItem) edit.add(new JMenuItem("Clear"));
        mi.setMnemonic('l');
	mi.getAccessibleContext().setAccessibleDescription("Clear the whole screen");
	mi.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
                clearAll();
                
	    }
	});
	
        //Design menus
	JMenu design = (JMenu) menuBar.add(new JMenu("Design"));
        design.setMnemonic('D');
	design.getAccessibleContext().setAccessibleDescription("Design an experiment with specified parameters");

        ButtonGroup group1 = new ButtonGroup();
        ToggleUIListener1 toggleUIListener1 = new ToggleUIListener1(); 
        
        state2MenuItem = (JRadioButtonMenuItem) design.add(new JRadioButtonMenuItem("Spin 1/2"));
        state2MenuItem.setMnemonic('2');
	state2MenuItem.getAccessibleContext().setAccessibleDescription("Choose Spin 1/2 atoms");
        state2MenuItem.setSelected(true);
        group1.add(state2MenuItem);
	state2MenuItem.addItemListener(toggleUIListener1);
	
        state3MenuItem = (JRadioButtonMenuItem) design.add(new JRadioButtonMenuItem("Spin 1"));
        state3MenuItem.setMnemonic('1');
	state3MenuItem.getAccessibleContext().setAccessibleDescription("Choose Spin 1 atoms");
        state3MenuItem.setSelected(false);
        group1.add(state3MenuItem);
	state3MenuItem.addItemListener(toggleUIListener1);

        su3MenuItem = (JRadioButtonMenuItem) design.add(new JRadioButtonMenuItem("SU(3)"));
        su3MenuItem.setMnemonic('S');
	su3MenuItem.getAccessibleContext().setAccessibleDescription(" ");
	su3MenuItem.setSelected(false);
	group1.add(su3MenuItem);
	su3MenuItem.addItemListener(toggleUIListener1);

        design.addSeparator();

        URL urlanal = Spins.class.getResource("images/Analyzer.gif");
	mi = (JMenuItem) design.add(new JMenuItem("New Analyzer", new ImageIcon(urlanal, "New Analyzer")));
        mi.setHorizontalTextPosition(JButton.LEFT);
        mi.setMnemonic('A');
        mi.getAccessibleContext().setAccessibleDescription("get a new instance of class Analyzer");
        mi.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_N, ActionEvent.CTRL_MASK));
        mi.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e) {
                drawNewDevice("Analyzer");
            }
        });
        
        URL urlmag = Spins.class.getResource("images/Magnet.gif");
	mi = (JMenuItem) design.add(new JMenuItem("New Magnet", new ImageIcon(urlmag, "New Magnet")));
        mi.setHorizontalTextPosition(JButton.LEFT);
        mi.setMnemonic('M');
        mi.getAccessibleContext().setAccessibleDescription("get a new instance of class Magnet");
        mi.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_M, ActionEvent.CTRL_MASK));
        mi.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e) {
                drawNewDevice("Magnet");
            }
        });

        URL urlcount = Spins.class.getResource("images/Counter.gif");
	mi = (JMenuItem) design.add(new JMenuItem("New Counter", new ImageIcon(urlcount, "New Counter")));
        mi.setHorizontalTextPosition(JButton.LEFT);
        mi.setMnemonic('r');
        mi.getAccessibleContext().setAccessibleDescription("get a new instance of class Counter");
        mi.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_K, ActionEvent.CTRL_MASK));
        mi.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e) {
                drawNewDevice("Counter");
            }
        });

        URL urlgun = Spins.class.getResource("images/Gun.gif");
	mi = (JMenuItem) design.add(new JMenuItem("New Gun", new ImageIcon(urlgun, "New Gun")));
        mi.setHorizontalTextPosition(JButton.LEFT);
        mi.setMnemonic('G');
        mi.getAccessibleContext().setAccessibleDescription("get a new instance of class Gun");
        mi.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_U, ActionEvent.CTRL_MASK));
        mi.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e) {
                drawNewDevice("Gun");
            }
        });
        
        design.addSeparator(); 

        mi = (JMenuItem) design.add(new JMenuItem("Change Angles"));
        mi.setMnemonic('A');
	mi.getAccessibleContext().setAccessibleDescription("Turn angle-analyzer to any angle");
        mi.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_A, ActionEvent.CTRL_MASK));
	mi.addActionListener(new AngleAction());
	
	
	design.addSeparator();
        redrawMenuItem = (JMenuItem) design.add(new JMenuItem("Redraw Screen"));
        redrawMenuItem.setMnemonic('R');
	redrawMenuItem.getAccessibleContext().setAccessibleDescription("redraw the screen after screen is moved");
	redrawMenuItem.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {	    
                repaint();
	    }
	});
	       
        //Control menus
 	JMenu control = (JMenu) menuBar.add(new JMenu("Control"));
        control.setMnemonic('C');
	control.getAccessibleContext().setAccessibleDescription("Control the designed experiment");

        URL urlgo = Spins.class.getResource("images/Go.gif");
	goMenu = (JMenuItem) control.add(new JMenuItem("Go", new ImageIcon(urlgo, "Start running"))); 
        goMenu.setHorizontalTextPosition(JButton.LEFT);
        goMenu.setMnemonic('G');
	goMenu.getAccessibleContext().setAccessibleDescription("Run the designed experiment");
        goMenu.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_G, ActionEvent.CTRL_MASK));
	goMenu.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
                goAction();
	    }
	});  

        URL urlstop = Spins.class.getResource("images/Stop.gif");
	stopMenu = (JMenuItem) control.add(new JMenuItem("Stop", new ImageIcon(urlstop, "Stop running"))); 
        stopMenu.setHorizontalTextPosition(JButton.LEFT);
        stopMenu.setMnemonic('S');
	stopMenu.getAccessibleContext().setAccessibleDescription("Stop running the designed experiment");
        stopMenu.setEnabled(false);
        stopMenu.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_S, ActionEvent.CTRL_MASK));
	stopMenu.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
                stopAction();
	    }
	});       

        resetMenu = (JMenuItem) control.add(new JMenuItem("Reset")); 
        resetMenu.setMnemonic('R');
	resetMenu.getAccessibleContext().setAccessibleDescription("clear the values of counters");
        resetMenu.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_R, ActionEvent.CTRL_MASK));
	resetMenu.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
                 goMenu.setEnabled(true);
                 stopMenu.setEnabled(false);
                 resetMenu.setEnabled(true);
                 if (watchIsTrue){
                    enableDoMenus(false);
                    sleepMenu.setEnabled(true);
                 }
                 else{
                    enableDoMenus(true);
                    sleepMenu.setEnabled(false);
                 }
                 watchMenu.setEnabled(true);
                 
       	         anExperiment.clearCounters();
				 stop = true;
	         
	         	drawBoard.repaint();
	    }
	});

        control.addSeparator();
        
        do1Menu = (JMenuItem) control.add(new JMenuItem("Do 1"));
        do1Menu.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_1, ActionEvent.CTRL_MASK));
        do1Menu.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e){                
                doAction(1);   
            }
        }); 
        do2Menu = (JMenuItem) control.add(new JMenuItem("Do 10"));
        do2Menu.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_2, ActionEvent.CTRL_MASK));
        do2Menu.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e){                
                doAction(10);   
            }
        });        

        do3Menu = (JMenuItem) control.add(new JMenuItem("Do 100"));
        do3Menu.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_3, ActionEvent.CTRL_MASK));
        do3Menu.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e){                
                doAction(100);   
            }
        }); 
        
        do4Menu = (JMenuItem) control.add(new JMenuItem("Do 1000"));
        do4Menu.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_4, ActionEvent.CTRL_MASK));
        do4Menu.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e){                
                doAction(1000);   
            }
        });    
        
        do5Menu = (JMenuItem) control.add(new JMenuItem("Do 10000"));
        do5Menu.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_5, ActionEvent.CTRL_MASK));
        do5Menu.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e){                
                doAction(10000);
            }
        });                  
        
        control.addSeparator();
        
        watchMenu = (JCheckBoxMenuItem) control.add(new JCheckBoxMenuItem("Watch"));
        watchMenu.setSelected(false);
        watchMenu.setMnemonic('W');
	watchMenu.getAccessibleContext().setAccessibleDescription("Attach a light to each measured analyzer output");
        watchMenu.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_W, ActionEvent.CTRL_MASK));
	watchMenu.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
	         goMenu.setEnabled(true);
	         stopMenu.setEnabled(false);
	         resetMenu.setEnabled(true);
	         watchMenu.setEnabled(true);
                 
                 if (watchMenu.isSelected()){
                     watchIsTrue = true;
                     enableDoMenus(false);
                     sleepMenu.setEnabled(true);          
                 }
                 else{
                     watchIsTrue = false;
                     enableDoMenus(true);
                     sleepMenu.setEnabled(false);
                 }
	    }
	});
        sleepMenu = (JMenuItem) control.add(new JMenuItem("Set Watch Time")); 
        sleepMenu.setMnemonic('T');
	sleepMenu.getAccessibleContext().setAccessibleDescription("set the sleep time of OS betweeb each run of atoms");
        sleepMenu.setAccelerator(KeyStroke.getKeyStroke(KeyEvent.VK_T, ActionEvent.CTRL_MASK));
        sleepMenu.setEnabled(false);
	sleepMenu.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
		String result;

                Object[] message = new Object[2];
                message[0] = "Please enter the sleep time:";
                message[1] = "(the old value is "+(new Integer(anExperiment.getWatchTime())).toString()+" milliseconds)";
		result = JOptionPane.showInputDialog(Spins.this, message);

                if (result != null){
    		   if (! result.trim().equals("")) {

		      try{
		         int sleep = (new Long(Math.round((new Double(result.trim())).doubleValue()))).intValue();
   	                 anExperiment.setWatchTime(sleep);
   	                 //restore it if you want to see what you just inputted. 
    		         //message[0] = "You want the sleep time to be ";
    		         //message[1] = result + " milliseconds";
    		         //JOptionPane.showMessageDialog(Spins.this, message);
    		      }
    		      catch(NumberFormatException e4){
    		         message[0] = "You just entered an incorrect number: "+result+".";
          	         message[1] = "Please try again later!";
                         JOptionPane.showMessageDialog(Spins.this, message,
				    "Warning", JOptionPane.WARNING_MESSAGE);	      
    		      }
                   }
                }
                
	        drawBoard.repaint();
	    }

	});
	
        //Initialize menus
 	JMenu initialize = (JMenu) menuBar.add(new JMenu("Initialize"));
        initialize.setMnemonic('I');
	ButtonGroup group2 = new ButtonGroup();
	ToggleUIListener2 toggleUIListener2 = new ToggleUIListener2();
	
        unknown1MenuItem = (JRadioButtonMenuItem) initialize.add(new JRadioButtonMenuItem("Unknown #1"));
        unknown1MenuItem.setMnemonic('1');
	unknown1MenuItem.setSelected(false);
	group2.add(unknown1MenuItem);
	unknown1MenuItem.addItemListener(toggleUIListener2);      

        unknown2MenuItem = (JRadioButtonMenuItem) initialize.add(new JRadioButtonMenuItem("Unknown #2"));
        unknown2MenuItem.setMnemonic('2');
        unknown2MenuItem.setSelected(false);
	group2.add(unknown2MenuItem);
	unknown2MenuItem.addItemListener(toggleUIListener2);
	
        unknown3MenuItem = (JRadioButtonMenuItem) initialize.add(new JRadioButtonMenuItem("Unknown #3"));
        unknown3MenuItem.setMnemonic('3');
        unknown3MenuItem.setSelected(false);
	group2.add(unknown3MenuItem);
	unknown3MenuItem.addItemListener(toggleUIListener2);

        unknown4MenuItem = (JRadioButtonMenuItem) initialize.add(new JRadioButtonMenuItem("Unknown #4"));
        unknown4MenuItem.setMnemonic('4');
        unknown4MenuItem.setSelected(false);
	group2.add(unknown4MenuItem);
	unknown4MenuItem.addItemListener(toggleUIListener2);

        //Unknown#5 (User State) allows the user to set the state with a dialog box
        unknown5MenuItem = (JRadioButtonMenuItem) initialize.add(new JRadioButtonMenuItem("User State"));
        unknown5MenuItem.setMnemonic('5');
        unknown5MenuItem.setSelected(false);
	group2.add(unknown5MenuItem);
	unknown5MenuItem.addItemListener(toggleUIListener2);
	
        randomMenuItem = (JRadioButtonMenuItem) initialize.add(new JRadioButtonMenuItem("Random"));
        randomMenuItem.setMnemonic('R');
	randomMenuItem.setSelected(true);
	group2.add(randomMenuItem);
	randomMenuItem.addItemListener(toggleUIListener2);
	
	//Help Menus
        JMenu help = (JMenu) menuBar.add(new JMenu("Help"));
        help.setMnemonic('H');
	help.getAccessibleContext().setAccessibleDescription("give some info about Spins");

        mi = (JMenuItem) help.add(new JMenuItem("Help"));
        mi.setMnemonic('H');
	mi.getAccessibleContext().setAccessibleDescription("Find out how to use the Spins application");
	mi.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
                   JPanel helpPanel = new HtmlPanel(spinsobj);
                   drawBoard.removeAll();
                   helpPanel.setBounds(drawBoard.getBounds());
                   drawBoard.add(helpPanel);

                   try{drawBoard.paintAll(drawBoard.getGraphics());}
                   catch(Exception e2){}
	    }
	});
 
        mi = (JMenuItem) help.add(new JMenuItem("Exit help"));
        mi.setMnemonic('E');
	mi.addActionListener(new ActionListener() {
	    public void actionPerformed(ActionEvent e) {
                   drawBoard.removeAll();
                   
                   for (int i=0; i<anExperiment.sizeOfComponents(); i++){
                       drawBoard.add(anExperiment.getComponent(i));
                   }
                   
                   for (int i=0; i<anExperiment.sizeOfLines(); i++){
                       drawBoard.add(anExperiment.getLine(i));
                   }
                                   
                   try{drawBoard.paintAll(drawBoard.getGraphics());}
                   catch(Exception e3){}
                   repaint();                  
	    }
	});
	return menuBar;
    }	//end createMenuBar

    private void initialMenuBarStatus(){
               state2MenuItem.setSelected(true);
               state3MenuItem.setSelected(false);
               su3MenuItem.setSelected(false);
               anExperiment.setSystem(0);
               
               unknown1MenuItem.setSelected(false);
               unknown2MenuItem.setSelected(false);
               unknown3MenuItem.setSelected(false);
               unknown4MenuItem.setSelected(false);
               unknown5MenuItem.setSelected(false);
               randomMenuItem.setSelected(true);

               anExperiment.setWhichInit(5);
    }

    private JPanel createToolBar(){
        JPanel p1 = new JPanel();
        p1.setAlignmentX(LEFT_ALIGNMENT);
        p1.setAlignmentY(TOP_ALIGNMENT);

        p1.setLayout(new BorderLayout());

        JToolBar toolBar = new JToolBar();

        addTool(toolBar, "Gun");
        addTool(toolBar, "Analyzer");
        addTool(toolBar, "Magnet");
        addTool(toolBar, "Counter");
        addTool(toolBar, "Go");
        addTool(toolBar, "Stop");

        p1.add(toolBar, BorderLayout.NORTH);
        
        JPanel drawPanel = new JPanel(new BorderLayout());

        p1.add(drawPanel, BorderLayout.CENTER);

 	drawBoard = new JPanel();
        //very important!!!!!
 	drawBoard.setLayout(null);
	drawBoard.setBorder(new CompoundBorder(emptyBorder0, loweredBorder)); 
        drawBoard.setBounds(0, 0, preferredWIDTH, preferredHEIGHT);

        JScrollPane scroller = new JScrollPane();
        scroller.setBorder(loweredBorder);
        JViewport vp = scroller.getViewport();
        //if donot have the following statement, scroller won't show up
        drawBoard.setPreferredSize(new Dimension(preferredWIDTH, preferredHEIGHT));
        vp.add(drawBoard);

        drawBoard.setBackground(backgroundColor);

        drawBoard.addMouseListener(this);
        drawBoard.addMouseMotionListener(this);

        drawPanel.add(scroller, BorderLayout.CENTER);

        return p1;
    }

    private void addTool(JToolBar toolBar, String n){
        //if you delete the following statement and use 'String name' as
        //parameter, you are going to get an error message.

        final String name = n;

        URL urlicon = Spins.class.getResource("images/"+name+".gif");
	Action A = new AbstractAction(name, new ImageIcon(urlicon, "An icon as shortcut to some menu selection")){
             public void actionPerformed(ActionEvent event){
                  if (name.equals("Analyzer")){
                      drawNewDevice("Analyzer");
                  }
                  else if (name.equals("Gun")){
                      drawNewDevice("Gun");
                  }
                  else if (name.equals("Magnet")){
                      drawNewDevice("Magnet");
                  }
                  else if (name.equals("Counter")){
                      drawNewDevice("Counter");
                  }
                  else if (name.equals("Go")){
                      goAction();
                  }
                  else if (name.equals("Stop")){
                      stopAction();
                  }
             }
        };

        ToolBarButton B = new ToolBarButton(A);
        
        if (name.equals("Go")){
            toolBar.addSeparator(new Dimension(15,15));
            B.setToolTipText("Start running");
        }
        else if(name.equals("Stop")){
            B.setToolTipText("Stop running");
        }
        else{
            B.setToolTipText("New "+name);
        }

        //In JDK 1.2, the tool bar buttons are much too wide when you use the windows look
        //and feel. The remedy is to call the following statement.
        B.setMargin(new Insets(0,0,0,0));

        //JToolBar class has a method to add an action as the following statement.
        //Unfortunately, the resulting tool bar looks rather unattractive because the
        //action names are displayed under the icons. ---from CoreJava or
        //                                            ---using Java1.2 by Joseph L. Weber
        //toolBar.add(A);

        toolBar.add(B);

        toolBar.addSeparator(new Dimension(5,5));

    }
//	Angle Action to get angle inputs
private AngleChooser dialog = null;
private class AngleAction implements ActionListener
	 {
	 	public void actionPerformed(ActionEvent e)
		{
         	// if first time, construct dialog
         	if (dialog == null) dialog = new AngleChooser(frame);
         	// pop up dialog
         	if (dialog.showDialog())
        	{
            		// if accepted, set angles
               		dialog.setAngles();
               		double newPhi = dialog.getPhi() * Math.PI / 180.0;
               		double newTheta = dialog.getTheta() * Math.PI / 180.0;    		      
               		anExperiment.SetPhi(newTheta, newPhi);
         	}
      		}
   	}
/**
   An angle chooser that is shown inside a dialog
*/
class AngleChooser extends JDialog 
{  
   public AngleChooser(JFrame owner)
   {  
      super(owner, "Angle Chooser", true);
      Container contentPane = getContentPane();
      contentPane.setLayout(new BorderLayout());
      contentPane.add(new JLabel("Choose Your Angles in Degrees", 
      			JLabel.CENTER),BorderLayout.NORTH);

      // construct a panel with theta and phi fields

      JPanel panel = new JPanel();
      panel.setLayout(new GridLayout(2, 2));
      NumberFormat numberFormat = NumberFormat.getNumberInstance();
      numberFormat.setMaximumFractionDigits(2);
      textFieldTheta = new DecimalField(90, 10, numberFormat); 
      textFieldPhi = new DecimalField(45, 10, numberFormat); 
      panel.add(new JLabel("Theta:",JLabel.RIGHT));
      panel.add(textFieldTheta);
      panel.add(new JLabel("Phi:",JLabel.RIGHT));
      panel.add(textFieldPhi);
      contentPane.add(panel, BorderLayout.CENTER);

      // create Ok and Cancel buttons that terminate the dialog
      
      JButton okButton = new JButton("OK");
      okButton.addActionListener(new
         ActionListener()
         {
            public void actionPerformed(ActionEvent e)
            {
               ok = true;
               dialog.setVisible(false);
            }
         });

      JButton cancelButton = new JButton("Cancel");
      cancelButton.addActionListener(new
         ActionListener()
         {
            public void actionPerformed(ActionEvent e)
            {
               dialog.setVisible(false);
            }
         });

      // add buttons to southern border

      JPanel buttonPanel = new JPanel();
      buttonPanel.add(okButton);
      buttonPanel.add(cancelButton);
      contentPane.add(buttonPanel, BorderLayout.SOUTH);
      setSize(250,140);
      //set angle maxima
      dataModelTheta.setMaximum(180);
      dataModelPhi.setMaximum(360);
   }
//end constructor

//access methods
   public double getTheta()
   {
     return dataModelTheta.getDoubleValue();
   }

   public double getPhi()
   {
     return dataModelPhi.getDoubleValue();
   }

   public void setAngles()
   {
     dataModelTheta.setDoubleValue(textFieldTheta.getValue());
     dataModelPhi.setDoubleValue(textFieldPhi.getValue());
// reset text fields since entries greater than max are set=max
     textFieldTheta.setValue(dataModelTheta.getDoubleValue());
     textFieldPhi.setValue(dataModelPhi.getDoubleValue());
}

   public boolean showDialog()
   {  
      ok = false;
      show();
      return ok;
   }

   DecimalField textFieldTheta;
   DecimalField textFieldPhi;
   ConverterRangeModel dataModelTheta = new ConverterRangeModel();
   ConverterRangeModel dataModelPhi = new ConverterRangeModel();
   private boolean ok;
}
//end angle chooser
 
    //Choosing go menu on the menu bar or go ToolBar goes to the same
    //function here
    private void goAction(){
                 //call run method in Experiment.java
                 //change submenus' status
                 goMenu.setEnabled(false);
                 stopMenu.setEnabled(true);
                 resetMenu.setEnabled(false);
                 sleepMenu.setEnabled(false);
                 enableDoMenus(false);
                 watchMenu.setEnabled(false);
        
                 stop = false;
                 anExperiment.start();

    }

    //Choosing stop menu on the menu bar or stop ToolBar goes to the same
    //function here
    private void stopAction(){
                 //change submenus' status
                 goMenu.setEnabled(true);
                 stopMenu.setEnabled(false);
                 resetMenu.setEnabled(true);
                 if (watchIsTrue){
                    enableDoMenus(false);
                    sleepMenu.setEnabled(true);
                 }
                 else{
                    enableDoMenus(true);
                    sleepMenu.setEnabled(false);
                 }
                 
                 watchMenu.setEnabled(true);
                 
                 stop = true;
                 anExperiment.pause();

    }

    class ToolBarButton extends JButton{
        public ToolBarButton(Action a){
            super((Icon) a.getValue(Action.SMALL_ICON));
            addActionListener(a);
        }
    }

    /*
     * Switch the system design between Spin 1/2 (0), Spin 1 (1),
     * and SU(3) (2).
     */
    class ToggleUIListener1 implements ItemListener {
	public void itemStateChanged(ItemEvent e) {

	    JRadioButtonMenuItem rb = (JRadioButtonMenuItem) e.getSource();
            if (rb.isSelected()) {
                String selected = rb.getText();
                int previous = anExperiment.getSystem();
                int current;
                if (selected.equals("Spin 1/2")) {
                   current = 0;
                } else if (selected.equals("Spin 1")) {
                   current = 1;
                } else {	//SU(3) was selected
                   current = 2;
                }
                anExperiment.setSystem(current);
                basis = 'Z';               
                if (anExperiment.getWhichInit() == 4){
                    getDataFromUser();
                }
                Spins.drawBoard.repaint();
            }
	}

    }
            
    /*
     * Switch the initial quamtum state  to 
     * Unknown#1, Unknown#2, Unknown#3, Unknown#4,
     * Unknown#5 (User State)or Random.
     */
    class ToggleUIListener2 implements ItemListener {
	public void itemStateChanged(ItemEvent e) {

	    JRadioButtonMenuItem rb = (JRadioButtonMenuItem) e.getSource();
            if (rb.isSelected()) {
                String selected = rb.getText();
                
                if (anExperiment.getWhichInit() == 4){
                    cancel();
                }
                 
                if (selected.equals("Unknown #1")) {
                   anExperiment.setWhichInit(0);
                } else if (selected.equals("Unknown #2")) {
                   anExperiment.setWhichInit(1);
                } else if (selected.equals("Unknown #3")) {
                   anExperiment.setWhichInit(2);
                } else if (selected.equals("Unknown #4")){
                   anExperiment.setWhichInit(3);
                } else if (selected.equals("User State")){
                   anExperiment.setWhichInit(4);
                   
                   basis = 'Z';
                   getDataFromUser();
                   //read initialState values from the user
                } else if (selected.equals("Random")){
                   anExperiment.setWhichInit(5);
                }
            }
	}
    }
    /*
     * Switch between choice of bases for user selectable
     * Unknown state #5.  Choices are X, Y, or Z
     */
    class ToggleUIListener3 implements ItemListener {
	public void itemStateChanged(ItemEvent e) {

	    JRadioButtonMenuItem rb = (JRadioButtonMenuItem) e.getSource();
            if (rb.isSelected()) {
                String selected = rb.getText();
                 
                if (selected.equals("X")) {

                    basis = 'X';
                } else if (selected.equals("Y")) {
                    basis = 'Y';

                } else if (selected.equals("Z")) {
                    basis = 'Z';
                } 
            }
	}
    }

//The start of help files for inputting data from table    
//If we do not move focus around, the update to the right-bottom cell
//might be ignored. I added one more row to get around this.

    private MyTableModel myModel = new MyTableModel();
    private Object[][] dataBak = {
            {"system", new String(), new String(), new String(),
                             new String(), new String(), new String()},
            {"", new String(), new String(), new String(),
                 new String(), new String(), new String()}
    };

    private void getDataFromUser(){

        Box box = Box.createHorizontalBox();//a box can use only BoxLayout

        switch (anExperiment.getSystem()){
            case 0: myModel.data[0][0] = " Spin 1/2 "; break;
            case 1: myModel.data[0][0] = " Spin 1 "; break;
            case 2: myModel.data[0][0] = " SU(3) "; break;
        }

        JTable table = new JTable(myModel);

        table.setRowHeight(25);
        table.setBorder(emptyBorder10);
        table.setPreferredScrollableViewportSize(new Dimension(WIDTH-150,15));

        //Create the scroll pane and add the table to it.
        JScrollPane scrollPane = new JScrollPane(table);
        
        Box tableBox = Box.createVerticalBox();//a box uses only BoxLayout by default
        tableBox.setSize(new Dimension(WIDTH -100,HEIGHT-350));

        //Set up real input validation for the Double column.
        setUpDoubleEditor(table);

        JPanel buttonPanel = new JPanel();
        buttonPanel.setBackground(Color.white);
        buttonPanel.setLayout(new FlowLayout());
        JButton submitButton = new JButton("Submit");
        submitButton.addActionListener(new ActionListener() {
            public void actionPerformed(ActionEvent e1){
                 //use old data for the input data. When cancel button is chosen
                 //ignore the change made to the data.
                 for (int i=0; i<myModel.getRowCount(); i++){
                     for (int j=1; j<myModel.getColumnCount(); j++){
                         dataBak[i][j] = myModel.getValueAt(i,j);
                     }
                 }
		/*If data is not entered in the Z basis, we must transform the
		* Initial State Vector to the Z basis.  Here we calculate the
		* rotation matrix necessary to do that.
		*/
                 Matrix rotMatrix = new Matrix();
                 if (basis != 'Z' && anExperiment.getSystem() != 2){

/***************************************************************************/
/* Here is the correspondence:                                             */
/*  EigenVector[0][m]---> EigenVector[X][m] for spin 1/2 (type 0)          */
/*  EigenVector[1][m]---> EigenVector[Y][m] for spin 1/2 (type 0)          */
/*  EigenVector[2][m]---> EigenVector[Z][m] for spin 1/2 (type 0)          */
/*                                                                         */
/*  EigenVector[7][m]---> EigenVector[Z][m] for spin 1 (type 1)            */
/*  EigenVector[8][m]---> EigenVector[X][m] for spin 1 (type 1)            */
/*  EigenVector[9][m]---> EigenVector[Y][m] for spin 1 (type 1)            */
/*                                                                         */
/* SO if user chooses basis = X, then we use:                              */
/* rotMatrix[m][n]= dotProduct of EigenVector[Z][m] and EigenVector[X][n]  */
/* if user chooses basis = Y, then we use:                                 */
/* rotMatrix[m][n]= dotProduct of EigenVector[Z][m] and EigenVector[Y][n]  */
/***************************************************************************/
/* additional correction for Spin 1 system since eigenvectors are ordered  */
/* 1, -1, 0 instead of normal order 1, 0, -1, which user inputs            */
/* rotMatrix[m][n]= dotProduct of EigenVector[Z][m] and EigenVector[X/Y][n]*/
/*              0                                                        0 */
/*              1                                                        2 */
/*              2                                                        1 */
/*           0                                   0                         */
/*           1                                   2                         */
/*           2                                   1                         */
/***************************************************************************/

                     int X, Y, Z;
                     if (anExperiment.getSystem() == 0){
                        X = 0;
                        Y = 1;
                        Z = 2;
                        for (int m=0; m<3; m++){
                          for (int n=0; n<3; n++){
                            if (basis == 'X'){
   rotMatrix.data[m][n] = anExperiment.EigenVector[Z][m].dotProduct(anExperiment.EigenVector[X][n]);
                            }
                            else{
                             //basis='Y' is true
   rotMatrix.data[m][n] = anExperiment.EigenVector[Z][m].dotProduct(anExperiment.EigenVector[Y][n]);
                            }
                          }
                        }
                     }
                     else {
                        //getSystem()= 1 is true
                        X = 8;
                        Y = 9;
                        Z = 7;
                     
                        int a, b;
                        for (int m=0; m<3; m++){
                          for (int n=0; n<3; n++){
                        
                            if (m == 0){
                              a = 0;
                            }                
                            else if (m == 1){
                              a = 2;
                            }
                            else{
                              // m==2
                              a = 1;
                            }
                          
                            if (n == 0){
                              b = 0;
                            }
                            else if (n == 1){
                              b = 2;
                            }
                            else{
                              //n==2
                              b = 1;
                            }
                          
                          if (basis == 'X'){
   rotMatrix.data[m][n] = anExperiment.EigenVector[Z][a].dotProduct(anExperiment.EigenVector[X][b]);
                          }
                          else{
                             //basis='Y' is true
   rotMatrix.data[m][n] = anExperiment.EigenVector[Z][a].dotProduct(anExperiment.EigenVector[Y][b]);
                          }
                        }
                     }
                     }
                 }
 
                     vector value = new vector();

                     value.data[0] = new Complex((new Double(makeEmptyToBeZero((String)dataBak[0][1]))).doubleValue(),
                                                 (new Double(makeEmptyToBeZero((String)dataBak[0][2]))).doubleValue());
                     value.data[1] = new Complex((new Double(makeEmptyToBeZero((String)dataBak[0][3]))).doubleValue(),
                                                 (new Double(makeEmptyToBeZero((String)dataBak[0][4]))).doubleValue());
                     if (anExperiment.getSystem() != 0){
                        value.data[2] = new Complex((new Double(makeEmptyToBeZero((String)dataBak[0][5]))).doubleValue(),
                                                 (new Double(makeEmptyToBeZero((String)dataBak[0][6]))).doubleValue());
                     }

                     value = value.normalize();
                 
                     if (basis == 'Z' || anExperiment.getSystem() == 2){
                         //do nothing
                     }
                     else{
                         //basis = 'Z' or 'Y'
                         value = rotMatrix.mvMul(value);
                     }
                
                     anExperiment.setInitialStateValue(anExperiment.getSystem(),4,value);

                   //restore the experiment onto screen
                   drawBoard.removeAll();
                 
                   for (int i=0; i<anExperiment.sizeOfComponents(); i++){
                       drawBoard.add(anExperiment.getComponent(i));
                   }

                   for (int i=0; i<anExperiment.sizeOfLines(); i++){
                       drawBoard.add(anExperiment.getLine(i));
                   }
                
                   try{drawBoard.paintAll(drawBoard.getGraphics());}
                   catch(Exception e3){}
                   repaint();
            }
            
            private String makeEmptyToBeZero(String aStr){
                   if (aStr.length() == 0){
                       return new String("0");
                   }
                   return aStr;            
            }
        });
        buttonPanel.add(submitButton);

        JButton cancelButton = new JButton("Cancel");
        cancelButton.addActionListener(new ActionListener(){
            public void actionPerformed(ActionEvent e2){
                cancel();
            }
        });
        buttonPanel.add(cancelButton);
        buttonPanel.setPreferredSize(new Dimension(
                     WIDTH-150,15));

        tableBox.add(Box.createRigidArea(new Dimension(
                    WIDTH-150,30)));
        JPanel p1 = new JPanel();
        p1.setPreferredSize(new Dimension(WIDTH-150,10));
        JLabel l1 = new JLabel("Input Real and Imag coefficients in basis of your choice");
        l1.setAlignmentX(CENTER_ALIGNMENT);
        l1.setForeground(Color.blue);
        l1.setFont(new Font("Dialog", Font.BOLD, 15));
        p1.add(l1);
        p1.setBackground(Color.white);
        tableBox.add(p1);
        if (anExperiment.getSystem() == 2){
           tableBox.add(Box.createRigidArea(new Dimension(
                    WIDTH-150, 68)));
        }
        else{
           //anExperiment.getSystem() == 0 or 1
           JPanel radioButtonPanel = new JPanel();
           radioButtonPanel.setBackground(Color.white);
           radioButtonPanel.setLayout(new FlowLayout());
           JLabel ll = new JLabel("Choose basis:");
           radioButtonPanel.add(ll);
           ButtonGroup group3 = new ButtonGroup();
           ToggleUIListener3 toggleUIListener3 = new ToggleUIListener3();
           JRadioButtonMenuItem XMenuItem = (JRadioButtonMenuItem) radioButtonPanel.add(new JRadioButtonMenuItem("X"));
           XMenuItem.addItemListener(toggleUIListener3);
           group3.add(XMenuItem);
           JRadioButtonMenuItem YMenuItem = (JRadioButtonMenuItem) radioButtonPanel.add(new JRadioButtonMenuItem("Y"));
           YMenuItem.addItemListener(toggleUIListener3);
           group3.add(YMenuItem);
           JRadioButtonMenuItem ZMenuItem = (JRadioButtonMenuItem) radioButtonPanel.add(new JRadioButtonMenuItem("Z"));
           ZMenuItem.setSelected(true);
	   ZMenuItem.addItemListener(toggleUIListener3);
           group3.add(ZMenuItem);
           tableBox.add(radioButtonPanel);
        }
        //Add the scroll pane to this table panel
        tableBox.add(scrollPane);
        tableBox.add(Box.createRigidArea(new Dimension(
                    WIDTH-150, 20)));
        tableBox.add(buttonPanel);
        tableBox.add(Box.createRigidArea(new Dimension(
                    WIDTH-150, preferredHEIGHT-HEIGHT+250)));

        box.add(Box.createRigidArea(new Dimension(
                   50,preferredHEIGHT)));
        box.add(tableBox);
        box.add(Box.createRigidArea(new Dimension(
                    preferredWIDTH-WIDTH+100,preferredHEIGHT)));

        drawBoard.removeAll();
        box.setBounds(drawBoard.getBounds());
        drawBoard.add(box);
        try{drawBoard.paintAll(drawBoard.getGraphics());}
        catch(Exception e3){}
    }
    // end getDataFromUser

    private void setUpDoubleEditor(JTable table) {
        //Set up the editor for the double cells.
        final DoubleNumberField doubleField = new DoubleNumberField(0, 0);
        doubleField.setHorizontalAlignment(DoubleNumberField.LEFT);

        DefaultCellEditor doubleEditor =
            new DefaultCellEditor(doubleField);

        //set doubleEditor is valid only for Double values on table
        table.setDefaultEditor(String.class, doubleEditor);
    }

        private void cancel(){
                //restore the original data for myModel
                   for (int i=0; i<myModel.getRowCount(); i++){
                       for (int j=1; j<myModel.getColumnCount(); j++){
                           myModel.setValueAt(dataBak[i][j],i,j);
                       }
                   }
                
                //restore the experiment onto screen
                   drawBoard.removeAll();
                 
                   for (int i=0; i<anExperiment.sizeOfComponents(); i++){
                       drawBoard.add(anExperiment.getComponent(i));
                   }

                   for (int i=0; i<anExperiment.sizeOfLines(); i++){
                       drawBoard.add(anExperiment.getLine(i));
                   }
                
                   try{drawBoard.paintAll(drawBoard.getGraphics());}
                   catch(Exception e3){}
                   repaint();
        }

    class MyTableModel extends AbstractTableModel {

        final String[] columnNames = {"System", 
                                      "Real 1",
                                      "Imag 1",
                                      "Real 2",
                                      "Imag 2",
                                      "Real 3",
                                      "Imag 3"};

        final Object[][] data = {
            {"      system       ", new String(), new String(), new String(),
                             new String(), new String(), new String()},
            {"", new String(), new String(), new String(),
                 new String(), new String(), new String()}

        };

        public int getColumnCount() {
            if (anExperiment.getSystem() == 0){
                return 5;
            }
            else{
                return 7;
            }
        }
        
        public int getRowCount() {
            return 2;
        }

        public String getColumnName(int col) {
            return columnNames[col];
        }

        public Object getValueAt(int row, int col) {
            return data[row][col];
        }

        public Class getColumnClass(int c) {
            return getValueAt(0, c).getClass();
        }

        /*
         * Don't need to implement this method unless your table's
         * editable
         */
        public boolean isCellEditable(int row, int col) {
            //Note that the data/cell address is constant,
            //no matter where the cell appears onscreen.
            
            if (col < 1 || row >= 1) { 
                return false;
            }
            else if (anExperiment.getSystem() == 0 && col > 4){
                return false;
            }
            return true;

        }

        //setValueAt is invoked every time user goes into a cell then exits
        public void setValueAt(Object value, int row, int col) {

            //allow only one decimal separator and one - (at the beginning) exists.
            //allow no leading 0 except '0.integer'
            String formattedValue;
            if (value instanceof String){
               //ignor the substring from the second '.'
               String str = ((String) value);
               
               if (str.length() == 0){
                  formattedValue = new String();
               }
               else{
                  //allow only one '-' at the beginning
                  if (str.indexOf('-') < 0){
                     //no '-' at all
                     //do nothing
                  }
                  else if (str.indexOf('-') != 0){
                     str = str.substring(0,str.indexOf('-'));
                  }
                  else if (str.indexOf('-',1) > 0){
                     //except a '-' at the beginning, there are more '-'s
                     str = str.substring(0, str.indexOf('-',1));
                  }
                  
                  //allow no leading 0 except '0.integer'
                  //need implementation code here

                  int firstDot = str.indexOf('.');
                  int endIndex = str.length();
                  if (firstDot < 0){
                     //no decimal separator
                  }
                  else{
                     if (firstDot < str.length()-1){
                        //if firstDot is not the last char of String str
                        int secondDot = str.indexOf('.', firstDot+1);
                        if (secondDot < 0){
                           //only one decimal separator
                        }
                        else{
                           //more than one dicimal separator
                           endIndex = secondDot;
                        }                        
                     }
                     else{
                        //get form 'integer.0' instead of 'integer.'
                        str = str +"0";
                     }
                  }
                  str = str.substring(0,endIndex);
                  formattedValue = str;
               }
            }
            else{
               //should never happen
               formattedValue = new String();
               System.out.println("Invalid value!");
            }

            data[row][col] = formattedValue;
            fireTableCellUpdated(row, col);
        }

    }

    public class DoubleNumberField extends JTextField {
        private Toolkit toolkit;

        public DoubleNumberField(double value, int columns) {
            super(columns);//constructs a new empty TextField with the 
                       //secified number of columns. When columns is 0,
                       //the preferred width will be whatever naturally results from the
                       //component implementation.
            toolkit = Toolkit.getDefaultToolkit();
        }

        protected Document createDefaultModel() {
            return new DoubleNumberDocument();
        }

        protected class DoubleNumberDocument extends PlainDocument {

            //overwrite insertString method to make some constraint to the input.
            //allow only digits and dots.
            public void insertString(int offs, 
                                 String str,
                                 AttributeSet a) 
                throws BadLocationException {
                char[] source = str.toCharArray();
                char[] result = new char[source.length];
                int j = 0;

                for (int i = 0; i < result.length; i++) {
 
                    if (Character.isDigit(source[i])){
                        result[j++] = source[i];
                    }
                    else if (source[i] == '.' || source[i] == '-'){
                        result[j++] = source[i];
                    }
                    else {
                        toolkit.beep();
                        System.err.println("insertString: " + source[i]);
                    }
                }
                //I tried and found that j is always 1

                super.insertString(offs, new String(result, 0, j), a);
            }
        }
    }

//the end of help files for input data from table
    
    public void enableDoMenus(boolean b){
                 do1Menu.setEnabled(b);
                 do2Menu.setEnabled(b);
                 do3Menu.setEnabled(b);
                 do4Menu.setEnabled(b);
                 do5Menu.setEnabled(b);        
    }

    /******************************************/
    /* cut a selected component on the screen */
    /******************************************/

    private void cutAction(){
               deviceSurface one;
               DrawLine aline;
               deviceSurface aobject;

               int i=0;
     
               while (i < anExperiment.sizeOfComponents()){
                   one = anExperiment.getComponent(i);

                   if (one.getClicked()){

 
                       for (int j=0; j<anExperiment.sizeOfLines(); j++){

 
                           if (anExperiment.getLine(j).Contains(i)){

 
                                      for (int l=0; l<drawBoard.getComponentCount(); l++){
                                          if (drawBoard.getComponent(l) instanceof DrawLine){
                                              aline = (DrawLine) drawBoard.getComponent(l);
                                              if (aline.equals(anExperiment.getLine(j))){
                                                  drawBoard.remove(l);
                                                  //l--;
                                                  break;
                                              }
                                          }
                                      }

                                      anExperiment.removeLine(j);
                                      j--;

                           }
                           else{
                               for (int k=0; k<3; k++){

                                   if (anExperiment.getLine(j).Contains(i, k)){

                                       for (int l=0; l<drawBoard.getComponentCount(); l++){
                                          if (drawBoard.getComponent(l) instanceof DrawLine){
                                              aline = (DrawLine) drawBoard.getComponent(l);
                                              if (aline.equals(anExperiment.getLine(j))){
                                                  drawBoard.remove(l);
                                                  //l--;
                                                  break;
                                              }
                                          }
                                      }

                                      anExperiment.removeLine(j);
                                      j--;
                                      break;
                                   }
                               }
                           }
                       }
                       
                       for (int l=0; l<drawBoard.getComponentCount(); l++){
                           if (drawBoard.getComponent(l) instanceof deviceSurface){
                               aobject = (deviceSurface) drawBoard.getComponent(l);
                               if (aobject.equals(one)){
                                   drawBoard.remove(l);
                                   //l--;
                                   break;
                               }
                           }
                       }

                       anExperiment.removeComponent(i);
                   }
                   else{
                       i=i+1;

                   }
                   
               }
               drawBoard.repaint();
    }

    /******************************************/
    /*initialize drawBoard and anExperiment,  */
    /*and make a clean screen                 */    
    /******************************************/
    
    private void clearAll(){
 
        if ( anExperiment.sizeOfComponents() != 0)
             anExperiment.initialize();
            
        drawBoard.removeAll();
        drawBoard.repaint();

    }

    /******************************************/
    /*  add a new component to the experiment */
    /******************************************/

    private void drawNewDevice(String type){

        if (type.equals("Gun")){
           //only one gun is allowed for an Experiment.
           for (int i=0; i<anExperiment.sizeOfComponents(); i++){
               if (anExperiment.getComponent(i) instanceof Gun){
                   JOptionPane.showMessageDialog(Spins.this, "There is only one gun needed for an experiment!",
				    "Warning", JOptionPane.WARNING_MESSAGE);
                   return;
               }
           }
        }
               
        try{
           deviceSurface theO = (deviceSurface) Class.forName(type).newInstance();
        
           anExperiment.addComponent(theO);
           theO.setBounds(drawBoard.getBounds()); 
           drawBoard.add(theO);
        }
        catch(Exception e){
           e.printStackTrace();
        }

      //drawBoard.paintAll here is very necessary since this is the first time to draw 
      //object. drawBoard.repaint() could not replace it.
        try{drawBoard.paintAll(drawBoard.getGraphics());}
        catch(Exception e){}
        drawBoard.repaint();//necessary. Otherwise, the screen becomes dirty when you use shortcut to generate a new device.
    }

    /*************************************************************/
    /*run the experiment */
    /*************************************************************/
    //the change made according to MassProduction() in original Pascal program
    //Send total atoms through the apparatus; rather than doing each one from
    //scratch, we first compute individual probabilities for ending up in each
    //counter, then just roll dice to total times to see where they all go. 
    //Currently we cannot do this when the "watch" command is in effect, since
    //the state of the system as it enters a component is not uniquely determined
    //in that case.  Someday this should be rewritten to get around the problem.
    public void doAction(int total){                
                //disable control menus
                goMenu.setEnabled(false);
                stopMenu.setEnabled(false);
                resetMenu.setEnabled(false);
                sleepMenu.setEnabled(false);
                enableDoMenus(false);
                watchMenu.setEnabled(false); 
                //selected watch does no effect on do action
                watchIsTrue = false;
                watchMenu.setSelected(false);
        
        //restore the following two lines if you want to zero variable count in Counters first.
        //anExperiment.clearCounters();
        //drawBoard.repaint();

        int [] indexOfCounters = new int [anExperiment.sizeOfComponents()];
        double [] accumulatedProb = new double [anExperiment.sizeOfComponents()];
        double rand;
        int cCount = 0;
        Random chance = new Random();
		//set seed to try and make more random
		chance.setSeed(chance.nextLong());
        anExperiment.ComputeUForMagnets();
        indexOfCounters = anExperiment.ComputeProbForCounters();
        for (int i=0; i<anExperiment.sizeOfComponents(); i++){
            if (indexOfCounters[i] == -1){
                break;
            }
            cCount++; 
                                  
            if (i == 0){
               accumulatedProb[0] = ((Counter) anExperiment.getComponent(indexOfCounters[i])).getProb();
            }
            else{
               accumulatedProb[i] = accumulatedProb[i-1] + ((Counter) anExperiment.getComponent(indexOfCounters[i])).getProb();
            }
        }

        int j;
        for (int HowMany=1; HowMany<=total; HowMany++){
            rand = chance.nextDouble();
            j = 0;
            while (accumulatedProb[j] <= rand && j < cCount){
                j++;
            }
            if (accumulatedProb[j] > rand){
                ((Counter) anExperiment.getComponent(indexOfCounters[j])).countIncreasedBy1();
            }
        }

                //enable control menus
                goMenu.setEnabled(true);
                stopMenu.setEnabled(false);
                resetMenu.setEnabled(true);
                enableDoMenus(true);
                watchMenu.setEnabled(true);
                
                if (watchIsTrue){
                    sleepMenu.setEnabled(true);
                }
                else{
                    sleepMenu.setEnabled(false);
                }

                //these two statements are very important.
                //The accelerator should behave the same way as the menu selection does. 
                //They actually are assigned to invoke the same function doAction, but I donot know why they behave differently.
                //If choose doAction by mouse click, the program behaves correctly, but if use accelerator, 
                //You need to click screen once more to get Counters correct without the following statements.
                
                Spins.sharedInstance().drawBoard.paintImmediately(Spins.sharedInstance().drawBoard.getBounds()); 
                drawBoard.repaint();    
    }
 
 
 /**************************************/
 /*  load image icon by file name      */
 /**************************************/

  public ImageIcon loadImageIcon(String filename, String description) {
    if(applet == null) {
      return new ImageIcon(filename, description);
    } else {
      URL url;
      try {
	url = new URL(applet.getCodeBase(),filename);

      } catch(MalformedURLException e) {
	  System.err.println("Error trying to load image " + filename);
	  return null;
      }
      return new ImageIcon(url, description);
    }
  }

  public static Spins sharedInstance() {
    return instance;
  }

  public java.applet.Applet getApplet() {
    return applet;
  }

 
  public boolean isApplet() {
    return (applet != null);
  }

  public Container getRootComponent() {
    if(isApplet())
      return applet;
    else
      return frame;
  }

  public Frame getFrame() {
    if(isApplet()) {
      Container parent;
      for(parent = getApplet(); parent != null && !(parent instanceof Frame) ; parent = parent.getParent());
      if(parent != null)
	return (Frame)parent;
      else
	return null;
    } else
      return frame;
  }

    public static void main(String[] args) { 
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
	    System.out.println("Error loading L&F: " + exc);
	}

	WindowListener l = new WindowAdapter() {
	    public void windowClosing(WindowEvent e) {System.exit(0);}
	};

	frame = new JFrame("Spins");
	frame.addWindowListener(l);
	frame.getAccessibleContext().setAccessibleDescription("A application for simulating a Stern-Gerlach laboratory in Physics quantum mechanics");

	JOptionPane.setRootFrame(frame);

        //do loading with anApplet=null here
        //do only loading, do not show it. It will be shown when frame.setSize is encountered. 
	Spins sw = new Spins();

	frame.getContentPane().removeAll();

	frame.getContentPane().setLayout(new BorderLayout());
	frame.getContentPane().add(sw, BorderLayout.CENTER);

	Dimension screenSize = Toolkit.getDefaultToolkit().getScreenSize();

	frame.setLocation(screenSize.width/2 - WIDTH/2,
			  screenSize.height/2 - HEIGHT/2);

        frame.show();  
      //when setSize is executed, the menus created in createMenuBar and new Spins()
      //are shown on the screen	
        frame.setSize(WIDTH, HEIGHT);

	frame.setCursor(Cursor.getPredefinedCursor(Cursor.DEFAULT_CURSOR));

	frame.validate();
	frame.repaint();
        sw.requestDefaultFocus();        

    }
}
