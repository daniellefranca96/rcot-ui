document.addEventListener('DOMContentLoaded', function() {
	
	function fetchPromptText(url) {
	  return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.onreadystatechange = function() {
		  if (xhr.readyState === 4) {
			if (xhr.status === 200) {
			  resolve(xhr.responseText);
			} else {
			  reject(new Error(`Failed to fetch prompt text: ${xhr.status}`));
			}
		  }
		};
		xhr.open('GET', url, true);
		xhr.send();
	  });
	}
	
	const sleep = ms => new Promise(r => setTimeout(r, ms));


	const urlV1 = "https://raw.githubusercontent.com/daniellefranca96/reflective-chain-of-thoughts/main/prompt-v1.txt";
	const urlV2 = "https://raw.githubusercontent.com/daniellefranca96/reflective-chain-of-thoughts/main/prompt-v2.txt";

	let promptV1;
	let promptV2;
	
	fetchPromptText(urlV1)
	  .then((text) => {
		promptV1 = text;
	  })
	  .catch((error) => {
		console.error('Failed to fetch prompt V1:', error);
	  });
	fetchPromptText(urlV2)
	  .then((text) => {
		promptV2 = text;
	  })
	  .catch((error) => {
		console.error('Failed to fetch prompt V1:', error);
	  });
	fetchPromptText(urlV2, promptV2);
	
	
    var form = document.getElementById('inputForm');
    var stopButton = document.getElementById('stopButton');
    var exportButton = document.getElementById('exportButton');
	let startButton = document.getElementById('startButton');
    var rcotProcess = null;
	
	let keepGoing = false;
	let outputText = "";
	let countLoops = 0;

    // Initialize select dropdowns
    M.FormSelect.init(document.querySelectorAll('select'));

    form.addEventListener('submit', function(event) {
        event.preventDefault();
		startButton.disabled = true;
		keepGoing = true;
        rcotProcess = {
            goal: document.getElementById('goal').value,
            expectedResult: document.getElementById('expectedResult').value,
            resources: document.getElementById('resources').value,
            maxLoops: document.getElementById('maxLoops').value,
            openAIKey: document.getElementById('openAIKey').value,
        };
		
		if(promptV1 === undefined || promptV2 === undefined){

		}

        // Example function to start the RCoT process
        startRCoTProcess(rcotProcess);

        M.toast({html: 'Process started!'});
        stopButton.classList.remove('disabled');
        stopButton.classList.remove('red');
        stopButton.classList.add('red', 'darken-2');
        exportButton.disabled = true; // Disable export until process is completed
    });

    stopButton.addEventListener('click', function() {
        if (rcotProcess) {            
			keepGoing = false;

            M.toast({html: 'Process stopped!'});
            exportButton.disabled = false; // Enable export after stopping the process
			startButton.disabled = false;
			stopButton.disabled = true;
			
        }
    });

    exportButton.addEventListener('click', function() {
        if (rcotProcess) {
            // Example function to export the RCoT results
            exportRCoTResults(rcotProcess);

            M.toast({html: 'Results exported!'});
        }
    });

    // Example functions for starting, stopping, and exporting RCoT process
    function startRCoTProcess(rcotProcess) {
        console.log('RCoT process started:', rcotProcess);
		document.getElementById("processDisplay").innerHTML = "Carregando...";
		stopButton.disabled = false;
		
		let selectModel = document.getElementById("model");
		let selectPromptVersion = document.getElementById("promptVersion");
		
		let modelName = selectModel.options[selectModel.selectedIndex].value;
		let promptVersion = selectPromptVersion[selectPromptVersion.selectedIndex].value;
		
		let prompt = '';
		if (promptVersion == "v1") {
            prompt = promptV1.replace("(fill the goal)", rcotProcess['goal'])
                             .replace("(fill the expected result)", rcotProcess['expectedResult']);
        } else {
            prompt = promptV2.replace("(fill the goal)", rcotProcess['goal'])
                             .replace("(fill the expected result)", rcotProcess['expectedResult'])
                             .replace("(default: unlimited, min: )", rcotProcess['resources'])
                             .replace("(default: as much as needed)", rcotProcess['maxLoops']);
        }
		
		
		prompt = outputText + countLoops != 0 ? prompt+"\n Continue the previous context above..." : prompt; 
		
		let tokensCount = 4096 - prompt.length;


			// Send the prompt to OpenAI's GPT-3 model
			fetch("https://api.openai.com/v1/chat/completions", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Authorization": "Bearer " + rcotProcess['openAIKey']
				},
				body: JSON.stringify({
					"messages": [{'content':prompt, 'role':'user'}],
					"max_tokens": tokensCount,
					"model": modelName
				})
			})
			.then(response => response.json())
			.then(data => {
				
				let div  = document.getElementById("processDisplay"); 
				let loops = document.getElementById("loops");
				
				beforeText = countLoops == 0 ? "" : div.innerHTML;
				
				const regex = /\d+\.\s/g;
				
				const regexP = /Prompt.*?:/g;
				
				outputText = data.choices[0].message.content.replaceAll(regexP, match => `<br><br><strong>${match}</strong>`).replaceAll(regex, "$&<br>");
				
				setTimeout(() => {
					div.innerHTML = beforeText+'<br>'+outputText;
				}, 1);
				
				loops.value = countLoops;
					

				// Reprompt itself continuously
				if (keepGoing) {
					countLoops++;
					sleep(2000);
					startRCoTProcess(rcotProcess);
				}
			})
			.catch(error => alert(error.message));
		
    }



    function exportRCoTResults(rcotProcess) {
		   // Get the text content from the div element
	  var docDefinition = {
		content: [
			document.getElementById('processDisplay').textContent
			]
		};

		pdfMake.createPdf(docDefinition).open();
    }
	

});
