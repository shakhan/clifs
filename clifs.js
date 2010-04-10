/*** Globals ***/
var clifs = {};					/* clifs */
TerminalShell.currentdir = '';	/* Stores the current dir path... */


/* INIT... */
$(document).ready(function() {
	Terminal.promptActive = true;
	
	/* Get the current dir from the server... */
	jQuery.get("/c_pwd", {},
		function (data) {
			if(data && data.message)
				TerminalShell.currentdir = data.message;
		}, "json"
	);

	/* On cli load, print some instructions on the term... */
	$('#screen').bind('cli-load', function(e) {
		Terminal.runCommand('welcome');
	});
});


/*** Utility commands ***/
clifs.util = function() {
	function func(terminal) {
		terminal.print('Use "pwd", "ls | dir", "cat", and "cd" to navigate the filesystem.');
		terminal.print('Use "sleep", "shutdown | poweroff", "logout | exit | quit", and "restart | reboot" to control the CLI.');
	};
	return {
		help: function(terminal) {
			func(terminal);
		},
		welcome: function(terminal) {
			terminal.print($('<h4>').text('Welcome to the clifs console.'));
			terminal.print('Use "help" to print this.');
			func(terminal);
		},
		again: function (terminal, cmd) {
			if (/!!/.test(cmd)) {
				var newCommand = cmd.replace('!!', this.lastCommand);
				terminal.print(newCommand);
				return newCommand;
			} else {
				return cmd;
			}
		}
	}
}();


/*** Commands for the filesystem ***/
clifs.nav = function() {
	return {
		list : function(terminal) {
			jQuery.get("/c_ls",
				{currentdir: this.currentdir},
				function (data) {
					if(data && data.message) {
						var name_list = $('<ul>');
						$.each(data.message, function(index, json) {
							if (json.isdir)
								json.name += '/';
							name_list.append($('<li>').text(json.name));
						});
						terminal.print(name_list);
					} else {
						terminal.print(this.currentdir +': No files or directories exist here.');
					}
				},
				"json"
			);	
		},
		cat : function(terminal, path) {
			jQuery.get("/c_cat",
				{currentdir: this.currentdir, file: path},
				function (data) {
					if(data && data.message) {
						var browser = $('<div>')
							.addClass('browser')
							.html('<pre>'+data.message+'</pre>').width("95%").height(400);
		                terminal.print(browser);
					}
				},
				"json"
			);	
		},
		cd : function(terminal, path) {
			jQuery.get("/c_cd",
				{message: path, currentdir: this.currentdir},
				function (data) {
					if(data && data.message) {
						TerminalShell.currentdir = data.message;
						terminal.print(data.message);
					} else
						terminal.print('cd: '+path+': No such file or directory');
				},
				"json"
			);
		},
		pwd : function(terminal) {
			terminal.print(TerminalShell.currentdir);
		}
	}
}();


/*** Control Commands for the CLI ***/
clifs.cntrl = function() {
	return {
		shutdown : function(terminal) {
			terminal.print('Broadcast message from user@clifs');
			terminal.print();
			terminal.print('The system is going down for maintenance NOW!');
			return $('#screen').fadeOut();
		},
		exit : function(terminal) {
			terminal.print('Bye.');
			$('#prompt, #cursor').hide();
			terminal.promptActive = false;
		},
		reboot : function(terminal) {
			TerminalShell.commands['poweroff'](terminal).queue(function(next) {
				window.location.reload();
			});
		},
		sleep : function(terminal, duration) {
			duration = Number(duration);
			if (!duration)
				duration = 5;
			terminal.setWorking(true);
			terminal.print("zzzzzzz....");
			$('#screen').fadeOut(1000);
			window.setTimeout(function() {
				terminal.setWorking(false);
				$('#screen').fadeIn();
				terminal.print("Wakey..wakey!!!");
			}, 1000*duration);
		}
	}
}();


/* Commands... */
TerminalShell.commands['help'] = clifs.util.help;		/* help */
TerminalShell.commands['welcome'] = clifs.util.welcome;	/* welcome */
TerminalShell.filters.push(clifs.util.again);			/* Run previous command */

TerminalShell.commands['dir'] = TerminalShell.commands['ls'] = clifs.nav.list;	/* dir | ls */
TerminalShell.commands['cat'] = clifs.nav.cat;									/* cat */
TerminalShell.commands['cd'] = clifs.nav.cd;									/* cd */
TerminalShell.commands['pwd'] = clifs.nav.pwd;									/* pwd */

TerminalShell.commands['shutdown'] = TerminalShell.commands['poweroff'] = clifs.cntrl.shutdown;							/* shutdown | poweroff */
TerminalShell.commands['logout'] = TerminalShell.commands['exit'] = TerminalShell.commands['quit'] = clifs.cntrl.exit;	/* logout | exit | quit */
TerminalShell.commands['restart'] = TerminalShell.commands['reboot'] = clifs.cntrl.reboot;								/* restart | reboot */
TerminalShell.commands['sleep'] = clifs.cntrl.sleep;																	/* sleep */
