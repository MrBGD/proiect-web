window.onload = function () {
    let url_input = document.getElementById("url");
    let clear = document.getElementById("clear_btn");
    let save = document.getElementById("save_btn");
    let loginBtn = document.getElementById("login_btn");
    let logoutBtn = document.getElementById("logout_btn");
    let userField = document.getElementById("username");
    let passField = document.getElementById("password");
    let loginSection = document.getElementById("login_section");
    let appSection = document.getElementById("app_section");
    const themeBtn = document.getElementById("theme_toggle");
    const loaderCanvas = document.getElementById("loaderCanvas");
    const apiResult = document.getElementById("apiResult");
    const ctxLoader = loaderCanvas.getContext("2d");
    let rotation = 0;
    let animationId = null;

    const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="40" height="40">
      <circle cx="25" cy="25" r="20" fill="none" stroke="#3498db" stroke-width="5" stroke-dasharray="80" stroke-linecap="round" />
    </svg>`;
    const img = new Image();
    img.src = 'data:image/svg+xml;base64,' + btoa(svgString);

    const section = document.querySelector(".url_validation");

    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark-mode");
        if(themeBtn) themeBtn.textContent = "Light Mode";
    }

    if(themeBtn) {
        themeBtn.addEventListener("click", function() {
            document.body.classList.toggle("dark-mode");
            if (document.body.classList.contains("dark-mode")) {
                localStorage.setItem("theme", "dark");
                this.textContent = "Light Mode";
            } else {
                localStorage.setItem("theme", "light");
                this.textContent = "Dark Mode";
            }
        });
    }

    checkSession();

    if(loginBtn) {
        loginBtn.addEventListener("click", function(e) {
            e.preventDefault();
            let u = userField.value;
            let p = passField.value;

            fetch("/static/users.json")
                .then(response => response.json())
                .then(users => {
                    let validUser = users.find(user => user.username === u && user.password === p);
                    if(validUser) {
                        localStorage.setItem("user_session", validUser.username);
                        checkSession();
                    } else {
                        alert("Date incorecte!");
                    }
                })
                .catch(err => console.error(err));
        });
    }

    if(logoutBtn) {
        logoutBtn.addEventListener("click", function() {
            localStorage.removeItem("user_session");
            checkSession();
        });
    }

    function checkSession() {
        if(localStorage.getItem("user_session")) {
            if(loginSection) loginSection.style.display = "none";
            if(appSection) appSection.style.display = "block";
            if(localStorage.getItem("saved_url")) {
                url_input.value = localStorage.getItem("saved_url");
            }
        } else {
            if(loginSection) loginSection.style.display = "block";
            if(appSection) appSection.style.display = "none";
        }
    }


    save.addEventListener("click", function (e) {
        const expression = /[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/gi;
        url_input.classList.remove("valid-input", "invalid-input");

        if (expression.test(url_input.value)) {
            url_input.classList.add("valid-input");
            localStorage.setItem("saved_url", url_input.value);

            if (section.lastElementChild.tagName === "P") {
                section.removeChild(section.lastElementChild);
            }

            let now = new Date();
            let timeString = now.toLocaleTimeString(); 
            let dateString = now.toLocaleDateString(); 
            let text = `URL: ${url_input.value} saved at ${dateString} ${timeString}`; 
            let element = document.createElement("p");
            element.textContent = text;
            element.style.color = getRandomColor();
            element.addEventListener("click", function(evt) {
                evt.stopPropagation();
                alert("Info: " + this.textContent);
            });

            section.appendChild(element);
            
            loaderCanvas.style.display = "inline-block";
            apiResult.textContent = "Scanning database...";
            
            if(animationId) clearInterval(animationId);
            animationId = setInterval(drawLoader, 50);

            scanUrl(url_input.value);

        } else {
            url_input.classList.add("invalid-input");
            let text = "URL invalid!";
            if (section.lastElementChild.tagName === "P") {
                section.removeChild(section.lastElementChild);
            }
            let element = document.createElement("p");
            element.style.color = "red";
            element.textContent = text;
            section.appendChild(element);
        }
    });

    clear.addEventListener("click", function () {
        localStorage.removeItem("saved_url");
        url_input.value = "";
        url_input.classList.remove("valid-input", "invalid-input");
        if (section.lastElementChild.tagName === "P") {
            section.removeChild(section.lastElementChild);
        }
        clearInterval(animationId);
        loaderCanvas.style.display = "none";
        apiResult.textContent = "";
        rotation = 0;
        ctxLoader.clearRect(0, 0, loaderCanvas.width, loaderCanvas.height);
    });

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function drawLoader() {
        ctxLoader.clearRect(0, 0, loaderCanvas.width, loaderCanvas.height);
        ctxLoader.save();
        ctxLoader.translate(loaderCanvas.width / 2, loaderCanvas.height / 2);
        ctxLoader.rotate(rotation * Math.PI / 180);
        ctxLoader.drawImage(img, -20, -20, 40, 40);
        ctxLoader.restore();
        rotation += 10;
    }

    async function scanUrl(url) {
        const apiKey = ''; 

        try {
            const requestTime = new Date();
            console.log(`[Request Sent]: ${requestTime.toISOString()}`);
            const submitResponse = await fetch('https://www.virustotal.com/api/v3/urls', {
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'content-type': 'application/x-www-form-urlencoded',
                    'x-apikey': apiKey
                },
                body: new URLSearchParams({ url: url })
            });

            const submitJson = await submitResponse.json();
            
            if(!submitJson.data) {
                throw new Error("API Limit or Key Error");
            }

            const analysisId = submitJson.data.id;
            
            const reportResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    'x-apikey': apiKey
                }
            });

            const reportJson = await reportResponse.json();
            console.log()
            clearInterval(animationId);
            loaderCanvas.style.display = "none";
            
            let stats = reportJson.data.attributes.stats;
            apiResult.textContent = `Malicious: ${stats.malicious}, Harmless: ${stats.harmless}`;
            
            if(stats.malicious > 0) {
                apiResult.style.color = "red";
            } else {
                apiResult.style.color = "green";
            }

        } catch (err) {
            console.error("Error:", err);
            clearInterval(animationId);
            loaderCanvas.style.display = "none";
            apiResult.textContent = "Connection Error";
        }
    }
}