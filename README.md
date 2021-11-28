# Blackhat foodle
A dynamic learning environment using Express, MongoDb, NodeJS 


Checkout our deployed version of the website at https://blackhat-foodle.herokuapp.com

# Key Features

## Sign Up and Sign In 
You can create a new account or login into your already existing account either as an instructor or a student.  
<img src="images/signup.jpg" alt="drawing" width="200"/>  
You can also update your name and email address after making your account.  
Additionally, a link is sent to your email address if you wish to update your password.

## Courses
As an instructor, you can create new courses and enroll students for it or invite all students to enroll via email.  
Within courses you can add announcements and post within discussion forums. You can also disable forums during exams to prevent cheating.  
<img src="images/courses.jpg" alt="drawing" width="600"/>  
You can also enroll TAs for your courses and choose to give them privileges flexibly like making announcements, creating and grading assignments.   
<img src="images/TA.jpg" alt="drawing" width="250"/>   
A student can see his enrolled courses and the percentage of a course completed by him.
<img src="images/studcourse.jpg" alt="drawing" width="500"/>  


## Assignments
Instructors can create new assignments within courses and view all submissions to grade. An assignment will also have a specified weightage and deadline and instructor will be warned if the submission is late.  
<img src="images/submission.jpg" alt="drawing" width="300"/>   
The instructors are also shown a To-Do list of all submissions left to grade while students are shown lists of assignments left to submit. 

## Grading
Instructor can grade each student manually or can upload grades and feedback in a CSV file downloaded with submissions.  
<img src="images/csv.jpg" alt="drawing" width="500"/>    
Instructors can also submit an autograding Python script which should output a grade on reading student's submission file as a command line argument.   

## Aggregates
The instructor is shown the mean, variance and histogram of marks of each assignment seperately. He/She is also shown the statistics of class averages of all assignments in a single graph.   
<p float="left">
  <img src="images/graph1.jpg" height="250" />
  <img src="images/graph2.jpg" height="250" /> 
</p>
Students are shown their progress in each assignment and course totals in a table. They are also informed if they are above or below the class average.</br>    
<img src="images/grades.jpg" alt="drawing" width="600"/>  

## Command Line Interface
We have also implemented a CLI which you can use to list your courses, enroll in courses, submit assignments, download submissions, etc. You can also save your credentials so you wont have to login repeatedly.   
<p float="left">
  <img src="images/cli.jpeg" height="250" />
  <img src="images/cli2.jpeg" height="300" /> 
</p>


## Chats
Instructors and Students can also DM each other privately.   
<img src="images/chat.jpg" alt="drawing" width="800"/>  





