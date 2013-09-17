These installation instructions are not meant for novices. Improvements are welcome.

### Quick and Simple (Demo purposes) Installation

If you're looking to demo Avocadojs, your best bet is to go to
avocadojs.com and demo it from there.
Unless you want the most up-to-date version of the code for some
reason, or you're playing with Avocadojs and you want to quickly demo
what you've done. In which case, throw the public directory somewhere
where a webserver can see its contents. For example, on Mac OS X,
start up your webserver, and then copy the "public" folder to the "Sites" directory.  

Remember, for the newer versions of OS X you'll have to start apache from the commandline, like so:  

>sudo apachectl start  
>sudo apachectl stop  
>sudo apachectl restart  

and you might have to do things like play with your user config file, ie:

>sudo vim /etc/apache2/users/USERNAME.conf

possibly writing something like this in there:

> \<Directory "/Users/alex/Sites/"\>  
>        Options Indexes Multiviews  
>        Options FollowSymLinks  
>        AllowOverride AuthConfig Limit  
>        Order deny,allow  
>        Deny from all  
>        Allow from 127.0.0.1  
> \</Directory\>  

### More complicated, development installation

I run Apache with WebDav, and serve the public
directory through there.

Don't do this alone, unless you're fairly confident you know what
you're doing. Enabling WebDav while Apache is running, without knowing
how to properly secure things, is probably a bad idea.

