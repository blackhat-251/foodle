#!/bin/python3
import requests, sys, re, click, json

baseURL = "https://blackhat-foodle.herokuapp.com/"

def login(s:requests.Session):
    
    cache = False

    try:
        f = open(".creds","r")
        creds = json.loads(f.read())
        username = creds["username"]
        password = creds["password"]

        f.close()
        cache = True
    except:
        username = input("Enter your username: ")
        password = input("Enter your password: ")

    try:
        r = s.post(f"{baseURL}login",data={"username":username,"password":password})
    except:
        print("Check your internet connection and try again")
        sys.exit(0)

    if "jwt" in s.cookies.keys():
        print("Logged in succesfully\n")
        role = r.url.split("/")[-2]
        
        if not cache:
            resp = input("Would you like to save your credentials? [y/N] ")

            if resp == "y":
                creds = {}
                creds["username"] = username
                creds["password"] = password

                f = open(".creds","w")
                f.write(json.dumps(creds))
                f.close()

        return role
    else:
        print("Incorrect credentials")
        sys.exit(0)

@click.group()
def cli():
    pass

@cli.command()
@click.option("--list-all", is_flag = True, help="List all your courses")
@click.option("--enroll-in", help="Enroll in a course, TEXT = coursecode")
def course(list_all, enroll_in):
    '''
    Course related stuff
    '''
    s = requests.Session()
    role =  login(s)

    if list_all:
        response = s.get(f"{baseURL}{role}/courses").text
        courses = re.findall(r"Title = (.*)",response)
        codes = re.findall(r"Code = (.*)", response)

        print("Courses enrolled :")

        for i in range(len(courses)):
            print(f"{courses[i]}    Coursecode: {codes[i]}")

    elif enroll_in :
        if role == "instructor":
            print("You are an instructor, you can't enroll")
            sys.exit(0)

        response = s.post(f"{baseURL}student/enroll_course",data={'coursecode':enroll_in})
        if not (response.url.endswith("/student/courses")):
            print("Either already enrolled or incorrect course code")
        else:
            print("Successfully enrolled")
        

@cli.command()
@click.option('--action', type = click.Choice(['list','pull', 'submit']),required = True,  help="Action to perform, \n list : listall assignments for a given course code \n, pull : download all submissions for a given assignment code (instructorr only) \n, submit : upload your submission for a given assignment code ")
@click.option('--course-code',help="Course code")
@click.option("--assgn-code", help="Assignment code")
@click.option("--file-path", help="Path to file")
def assignment(action, course_code, assgn_code, file_path):
    '''
    Assignment related stuff
    '''

    s = requests.Session()
    role = login(s)

    if action == "list":
        if not course_code:
            print("Provide --course-code  with action = list")
            sys.exit(0)
        else:
            response = s.get(f"{baseURL}{role}/assignments/{course_code}").text

            titles = re.findall(r"Title: (.*)",response)
            desc = re.findall(r"Description: (.*)", response)
            due = re.findall(r"Due Deadline: (.*)", response)
            codes = re.findall(r'<form action="/upload/(.*)"',response)

            print("Assignments for this course:\n")
            for i in range(len(titles)):
                print(f"Title : {titles[i]}")
                print(f"Description : {desc[i]}")
                print(f"Due date : {due[i]}")
                print(f"Assignment code : {codes[i]}")
                print()

    elif action == "pull":
        if not assgn_code:
            print("Provide --assgn-code with action = pull")
            sys.exit(0)

        if role != "instructor":
            print("This action is instructor only")
            sys.exit(0)

        try:
            response = s.get(f"{baseURL}download_all/{assgn_code}",stream=True)
        except:
            print("Check your internet connection and try again")
            sys.exit(0)

        if "unauthorised access" in response.text:

            print("You are not authorized to access thisassignment")
            sys.exit(0)                             

        filename = re.findall(r'filename="(.+)"', response.headers["Content-Disposition"])[0]

        with open(f"./downloads/{filename}","wb") as f:
            for chunk in response.iter_content(chunk_size=1024):                                         
                if chunk:
                    f.write(chunk)                      

        print(f"Submissions downloaded in downloads/{filename}")

    elif action == "submit":
        if not assgn_code or not file_path:
            print("Provide --file-path, --assgn-code  with action = submit")
            sys.exit(0)

        if role != "student":
            print("This action is student only")
            sys.exit(0)
        
        
        try:
            f = open(file_path,"rb") 
        except:
            print("No file at the provided path")
            sys.exit(0)
        
        try:
            response = s.post(f"{baseURL}upload/{assgn_code}",files={"file":f},allow_redirects=False)
        except:
            print("Check your internet connection and try again")
            sys.exit(0)

        if "unauthorized access" in response.text:
            print("You are not authorized to access this assignment")
            sys.exit(0)

        print("Successfully submitted the assignment")    
        f.close()

if __name__ == "__main__":
    cli()   

