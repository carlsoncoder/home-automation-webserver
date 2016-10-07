# Carlson Home Automation Web-Server

This is the source code for my home automation web server

This application is designed to run on an AWS EC2 instance - running Ubuntu 16.04.  It gets very little traffic so I used the t1.nano instance size.

You need MongoDB for this application.  I used [these instructions](https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-16-04 "Install MongoDB") to install it.

You will also need to setup two inbound port rules on the Security Group assigned to your EC2 instance:

* Type - HTTPS, Protocol - TCP, Port Range - 443, Source 0.0.0.0/0
* Type - Custom TCP Rule, Protocol - TCP, Port Range - 8883, Source 0.0.0.0/0

*Note - I'm opening this up to ALL external addresses (with the source of 0.0.0.0/0, but you could certainly restrict this as your situation dictates*


Additionally, you will need to setup a port forwarding rule on the EC2 instance to direct inbound 443 traffic to 4443.  You can do this using the iptables command on the EC2 instance:

        sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to 4443

*Note - I would recommend you look into the 'iptables-persistent' package to persist these firewall rules, as they will otherwise be removed upon reboot.  More information can be found in this very helpful post [here.](https://www.thomas-krenn.com/en/wiki/Saving_Iptables_Firewall_Rules_Permanently "iptables-persistent")*

*Another Note - See an example of my script I used with iptables-persistent [here.](https://gist.github.com/carlsoncoder/f7e517c9ba520c7beef6bc14812399f9 "iptables-persistent-setup-gist")*

You will also need an SSL certificate and the private key file as well.  These should be placed in the root of the directory in a folder called "certs".  Note this is NOT included in this repo.

Lastly, you will need to create a file called "config.js" in the "config" folder.  You will need to fill in the appropriate values:

        var garageClientIds = ['rpi-garage-1', 'rpi-garage-2'];
        
        var garageClientDetails = [
            {
                clientId: 'rpi-garage-1',
                description: 'House Garage',
                sortOrder: 1
            },
            {
                clientId: 'rpi-garage-2',
                description: 'Secondary Garage',
                sortOrder: 2
            }
        ];
        
        var options = {
            JWT_SECRET_KEY :                "your-JWT-secret-key",
            MY_NODE_ENV :                   "production",
            MONGO_DB_CONNECTION_STRING :    "mongodb://localhost/homeautomationwebserver",
            MOSCA_USERNAME:                 "yourMoscaUserName",
            MOSCA_PASSWORD:                 "yourMoscaPassword",
            CERT_KEY_PATH:                  "certs/nameOfCertPrivateKey",
            CERT_PATH:                      "certs/nameOfMainCertificate"
        };
        
        options.isClientIdValid = function(clientId) {
            if (garageClientIds.indexOf(clientId) > -1) {
                return true;
            }
            
            return false;
        };
        
        options.getValidGarageClientIds = function() {
            return garageClientIds;
        };
        
        options.getGarageClientDetails = function() {
            return garageClientDetails;
        };
        
        module.exports = options;

These values are pretty straightforward.  You would specifically need to fill in your own values for the 'garageClientIds' and 'garageClientDetails' sections.
Additionally, all of the values in the 'options' variable need to be set with your own values, except MY_NODE_ENV and MONGO_DB_CONNECTION_STRING can stay the same.  Please 
note that this file is NOT included with this repo, and you will have to add it on your own.

Once you have all of this setup, you'll want to cofigure your NodeJS instance to start automatically on startup.  For this, I use [forever.](https://www.npmjs.com/package/forever "Forever - NPM")  You can install this with the following command:

        sudo npm install -g forever

I've already included a "forever-start" file in the repo as 'forever-start.sh'.  There isn't much to it:

        #!/usr/bin/env bash
        forever start -a app.js

We'll now make a startup script that calls our forever-start.sh script.  Create a file (doesn't matter where, just remember the full path to it) called "start-webserver-on-boot.sh".  Put the following in it:

        #!/usr/bin/env bash
        # hack - sleep for 30 seconds to ensure MongoDB has started up successfully
        sleep 30
        cd /home/ubuntu/home-automation-webserver/
        ./forever-start.sh

Now, open up your CRON editor with the follwowing command:

        sudo crontab -e

Add the following line, then save the file (making sure the path is the same as where you saved your file):

        @reboot /home/ubuntu/start-webserver-on-boot.sh

And that's it.  If you ever wanted to manually stop the forever instance, you can just run the "forever-stop.sh" bash script in the repo.

Feel free to reach out to me at Twitter via [@carlsoncoder](https://twitter.com/carlsoncoder "@carlsoncoder") with any questions, or check out [my blog.](http://www.carlsoncoder.com/ "Carlson Coder Blog")

Thanks,
Justin

License
----
All code in this repository that was created by me is considered [Beerware](http://en.wikipedia.org/wiki/Beerware "Beerware")

