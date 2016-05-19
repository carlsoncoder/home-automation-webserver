# Carlson Home Automation Web-Server

This is the source code for my home automation web server

This application is designed to run on an AWS EC2 instance - running Ubuntu 14.04.  It gets very little traffic so I used the t1.nano instance size.

You will need to setup two inbound port rules on the Security Group assigned to your EC2 instance:

* Type - HTTPS, Protocol - TCP, Port Range - 443, Source 0.0.0.0/0
* Type - Custom TCP Rule, Protocol - TCP, Port Range - 8883, Source 0.0.0.0/0

*Note - I'm opening this up to ALL external addresses (with the source of 0.0.0.0/0, but you could certainly restrict this as your situation dictates*


Additionally, you will need to setup a port forwarding rule on the EC2 instance to direct inbound 443 traffic to 4443.  You can do this using the iptables command on the EC2 instance:
            
        sudo iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to 4443

*Note - I would recommend you look into the 'iptables-persistent' package to persist these firewall rules, as they will otherwise be removed upon reboot.  More information can be found in this very helpful post [here.](https://www.thomas-krenn.com/en/wiki/Saving_Iptables_Firewall_Rules_Permanently "iptables-persistent")*

You will also need an SSL certificate and the private key file as well.  These should be placed in the root of the directory in a folder called "certs".  Note this is NOT included in this repo.

Lastly, you will need to create a file called "config.js" in the "config" folder.  You will need to fill in the appropriate values:

        var garageClientIds = ['client-id-1', 'client-id-2'];
        var validClientIds = [];
        validClientIds.push.apply(validClientIds, garageClientIds);
        
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
            if (validClientIds.indexOf(clientId) > -1) {
                return true;
            }
            
            return false;
        };
        
        options.getValidGarageClientIds = function() {
            return garageClientIds;
        };
        
        module.exports = options;

These values are pretty straightforward.  You would specifically need to fill in lines 1, 6, and 9-12 with your appropriate values.  Note this file is NOT included in this repo.

Check out  here.

Feel free to reach out to me at Twitter via [@carlsoncoder](https://twitter.com/carlsoncoder "@carlsoncoder") with any questions, or check out [my blog.](http://www.carlsoncoder.com/ "Carlson Coder Blog")

Thanks,
Justin

License
----
All code in this repository that was created by me is considered [Beerware](http://en.wikipedia.org/wiki/Beerware "Beerware")

