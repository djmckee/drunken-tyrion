#REQUIREMENTS TO RUN THIS SCRIPT:
#1. install pip: 'sudo easy_install pip'
#2. install slimit: 'sudo pip install slimit'
#3. install validation stuff: 'sudo pip install py_w3c'
#(sudo is required because you're installing on the system Python - if you wanna be safer/neater, look into virtual environments :-) )


#Build script for the project.
#build.py takes index-dev.html and main.js
#minifies main.js to main.min.js
#creates index.html, which links against main.min.js (and minified jquery too).
#all of these dependencies should be in the current working directory!
#dependency names can all be changed below...

import os   #so that we can delete existing copies of the file.
import re   #so we can run regex to remove console.log messages from production code
from slimit import minify #so we can minify the javascript!
from py_w3c.validators.html.validator import HTMLValidator #HTML Validation

#declare file names...
input_file_name = 'index-dev.html'
output_file_name = 'index.html'
js_file_name = 'main.js'

do_you_want_your_javascript_mangled = True

print 'Starting build.'

#firstly, let's minify some javascript...
#open the file up...
with open (js_file_name) as js_file:
    print 'Found ' + js_file_name
    #read the file
    js_string = js_file.read()
    #run the minifier...
    minified = minify(js_string, mangle=do_you_want_your_javascript_mangled, mangle_toplevel=do_you_want_your_javascript_mangled)
    #remove any console.log's - this is production grade JS!
    minified = re.sub(r'console.log((.*?));', ' ', minified)
    #work out a suitable file name...
    minified_js_name = js_file_name.replace('.js', '.min.js')
    #remove old versions of the file...
    try:
        #give this a go, if one exists
        os.remove(minified_js_name)
        print 'Removed existing ' + minified_js_name
    except:
        #may not already exist.
        print 'No existing ' + minified_js_name

    #create our new file...
    output_file = open(minified_js_name, 'w')
    #and save the string into it...
    output_file.write(minified)
    output_file.close()
    #feedback to the user :-)
    print 'Written new ' + minified_js_name

#now for the HTML...
#open the file up...
with open (input_file_name) as html_file:
    print 'Found ' + input_file_name
    #read the file
    file_string = html_file.read()
    #replace any '.js' with '.min.js'...
    new_string = file_string.replace('.js', '.min.js')
    #remove old versions of the file...
    try:
        #give this a go, if one exists
        os.remove(output_file_name)
        print 'Removed existing ' + output_file_name
    except:
        #may not already exist.
        print 'No existing ' + output_file_name

    #create our new file...
    output_file = open(output_file_name, 'w')
    #and save the string into it...
    output_file.write(new_string)
    output_file.close()
    #feedback to the user :-)
    print 'Written new ' + output_file_name
    print 'Build complete.'

    print 'Starting HTML validation...'
    try:
        vld = HTMLValidator()
        #validate!
        vld.validate_fragment(new_string)

        number_of_errors = len(vld.errors)
        number_of_warnings = len(vld.warnings)

        validity_statement = 'That HTML is mighty valid!'
        if number_of_errors > 0:
            #that's not valid xhtml!
            validity_statement = "That's not valid HTML!"

        print '\n  ___\n /~ ~\   ___________________________\n| 0 0 | /"' + validity_statement + '" /\n|  ^  |-----------------------------\n|  O  |\n \\___/\n'

        print 'There are ' + str(number_of_errors) + ' errors and ' + str(number_of_warnings) + ' warnings.'

        if number_of_errors < 1:
            #TODO: Impliment Domino's API to order pizza on succesful build completion.
            print 'Great job! :~)'

    except:
        print '\n  ___\n /~ ~\   ___________________________\n| 0 0 | /"' + "I'm so so sorry :'(" + '" /\n|  ^  |-----------------------------\n|  O  |\n \\___/\n'
        print "Sorry, I can't validate your XHTML at the moment."
