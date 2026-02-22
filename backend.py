from flask import Flask, render_template,url_for, render_template_string, request, redirect, flash, session
from flask_session import Session
import sqlite3


DATABASE="C:/faculta/web/atestat-main/atestat-main/credentials.db"
TEMPLATE_FOLDER="C:/faculta/web/atestat-main/atestat-main/templates"
SECRET_KEY="atestat"


app=Flask(__name__, template_folder=TEMPLATE_FOLDER)
app.secret_key=SECRET_KEY
app.config["SESSION_PERMANENT"]=False
app.config["SESSION_TYPE"]="filesystem"
Session(app)
def get_db():
    db = getattr(Flask, DATABASE, None)
    if db is None:
        db = Flask._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

global_search_queries=[]

@app.route("/", methods=['GET','POST'])
def index():

   

    if request.method=="POST" :
        username=request.form.get("username")
        password=request.form.get("password")

        db=get_db()
        sql = f"SELECT * FROM credentials WHERE username='{username}' and password='{password}'; "
        response=db.execute(sql)
        user = response.fetchone()
        if user:
            session["username"]=user["username"]
            session["role"]=user["role"]
            if user["role"]=="admin":
                return redirect("dashboard")
            if user["role"]=="user":
                return redirect("page")
        else:
            flash("invalid credentials")
            return redirect("/")
        
        
    return render_template("index.html")

@app.route("/403")
def forbidden():
    return render_template("403.html")

@app.route("/profile")
def profile():
    if not session.get("username"):
        return redirect("/")
    return render_template("profile.html", username=session["username"], role=session["role"])



@app.route("/dashboard")
def atmin_panel():

    if session.get("role") !="admin":
         return redirect("403")
    query=request.args.get('search_item')
    if query:
        global_search_queries.append(query)
    return render_template("dashboard.html", admin_query=query,all_queries=global_search_queries)



@app.route("/page")
def user_panel():
    if session.get("username") is None or "":
        return redirect("/")
    query=request.args.get('search_item')
    css=url_for('static',filename='styles/design2.0.css')
    rendered_input = f'''
        <div class="search-result">
            <h3>Search Query Result:</h3>
            <p>{query}</p>
        </div>
    ''' if query else ""
    if query:
        global_search_queries.append(query)
    template=f'''
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>User Dashboard</title>
            <link rel="stylesheet" href="{css}">
        </head>
        <body>
            <div class="container">
                <header class="header">
                    <h1>Welcome, user!</h1>
                    <nav class="navbar">
                        <ul>
                            <li><a href="#">Home</a></li>
                            <li>
                                <a href="#">Profile</a>
                                <ul class="dropdown">
                                    <li><a href="/profile">Proifle & Settings</a></li>
                                    <li><a href="#">History</a></li>
                                </ul>
                            </li>
                            <li><a href="#">Help</a></li>
                        </ul>
                    </nav>
                </header>

                <section class="dashboard">
                    <h2>Your Dashboard</h2>
                    <a class="logout-btn" href="/logout">Logout</a>
                </section>

                <section class="search-section">
                    <form class="search-form" method="GET">
                        <input type="text" name="search_item" class="search-field" placeholder="Search something...">
                    </form>
                </section>

            {rendered_input}

                   <main>

            <aside>
                <h3>Tips</h3>
                <p>Check your recent updates and manage your account settings easily!</p>
            </aside>
        </main>
        

        <footer>
            <p> 2025 User Dashboard | All rights reserved.</p>
        </footer>
    </div>
</body>
</html>'''


    return render_template_string(template)




@app.route("/logout")
def logout():
    session.clear()
    global_search_queries.clear
    return redirect("/")


if __name__=="__main__":
    app.run(debug=True, port=5001)