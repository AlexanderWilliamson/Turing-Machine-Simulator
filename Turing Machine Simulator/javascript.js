const ruleEntry = document.getElementById("ruleEntry");
const scrollMenu = document.getElementById("scrollMenu");
const startNew = document.getElementById("startNew");
const errorText = document.getElementById("errorText");
const backButton = document.getElementById("backButton");
const forwardButton = document.getElementById("forwardButton");
const turnCounter = document.getElementById("turnCounter");
const showPattern = document.getElementById("showPattern");
const autoUntil = document.getElementById("autoUntil");
const autoX = document.getElementById("autoX");
const autoUntilInput = document.getElementById("autoUntilInput");
const autoXInput = document.getElementById("autoXInput");
const performanceMode = document.getElementById("performanceMode");

const machine = new Machine();
let halt = true;
let updateScrollMenu = true;

startNew.addEventListener("click", function(){
	let ruleString = ruleEntry.value.toUpperCase();
	let temp = "";
	
	for (let i = 0; i < ruleString.length; i++)
		if (ruleString[i] != "_")
			temp += ruleString[i];
	
	ruleString = temp;
	
	if (!validRuleString(ruleString)){
		errorText.innerHTML = "Incorrect format";
		return;
	}
	
	updateScrollMenu = !performanceMode.checked;
	errorText.innerHTML = "";
	machine.start(ruleString);
	displayRules();
});

backButton.addEventListener("click", function(){
	machine.goBack();
});

forwardButton.addEventListener("click", function(){
	if (!halt)
		machine.applyRule();
});

autoUntil.addEventListener("click", function(){
	if (halt)
		return;
	
	let target = 0;
	if (autoUntilInput.value.toLowerCase() == "halt")
		target = Infinity;
	else{
		if (isNaN(autoUntilInput.value) || isNaN(parseFloat(autoUntilInput.value))){
			errorText.innerHTML = "Not a number";
			return
		}
		target = parseFloat(autoUntilInput.value);
	}
	
	if (target < machine.turnCount){
		errorText.innerHTML = "Target must be greater than current turns";
		return
	}
	
	errorText.innerHTML = "";
	machine.autoRule(target);
});

autoX.addEventListener("click", function(){
	if (halt)
		return;
	
	if (isNaN(autoXInput.value) || isNaN(parseFloat(autoXInput.value))){
		errorText.innerHTML = "Not a number";
		return
	}
	
	if (parseFloat(autoXInput.value) < 1){
		errorText.innerHTML = "X must be greater than 0";
		return
	}
	
	let target = machine.turnCount + parseFloat(autoXInput.value);
	
	console.log("got this far");
	
	errorText.innerHTML = "";
	machine.autoRule(target);
});


function Machine(){
	this.leftNode = null;
	this.rightNode = null;
	this.currentNode = null;
	this.rules = {};
	this.currentRule = null;
	this.memo = {};
	this.turns = null
	this.turnCount = 0;
	this.size = 0;
	
	this.start = function(ruleString){
		this.leftNode = new Node(0, 0);
		this.rightNode = this.leftNode;
		this.currentNode = this.leftNode;
		this.rules = this.getRules(ruleString);
		this.currentRule = "A";
		this.memo = {};
		this.memo[0] = this.leftNode;
		this.turns = new Queue();
		this.turnCount = 0;
		this.size = 1;
		
		if (updateScrollMenu){
			scrollMenu.innerHTML = "";
			const zero = document.createElement("div");
			zero.id = "square" + 0;
			zero.className = "blacksquare active";
			scrollMenu.appendChild(zero);
		}
		
		for (let i = 0; i < 7; i++){
			this.addLeft();
			this.addRight();
		}
		
		turnCounter.innerHTML = "Turns: " + this.turnCount;
		halt = false;
	};
	
	this.addLeft = function(){
		let newIndex = this.leftNode.index - 1;
		this.memo[newIndex] = new Node(0, newIndex, null, this.leftNode);
		this.leftNode.left = this.memo[newIndex];
		this.leftNode = this.memo[newIndex];
		this.size++;
		
		if (updateScrollMenu){
			const zero = document.createElement("div");
			zero.id = "square" + newIndex;
			zero.className = "blacksquare";
			scrollMenu.insertBefore(zero, scrollMenu.children[0]);
		}
	};
	
	this.addRight = function(){
		let newIndex = this.rightNode.index + 1;
		this.memo[newIndex] = new Node(0, newIndex, this.rightNode);
		this.rightNode.right = this.memo[newIndex];
		this.rightNode = this.memo[newIndex];
		this.size++;
		
		if (updateScrollMenu){
			const zero = document.createElement("div");
			zero.id = "square" + newIndex;
			zero.className = "blacksquare";
			scrollMenu.appendChild(zero);
		}
	};
	
	this.moveLeft = function(){
		if (updateScrollMenu)
			document.getElementById("square" + this.currentNode.index).className = this.currentNode.val == 1 ? "whitesquare" : "blacksquare";
		
		this.currentNode = this.currentNode.left;
		if (Math.abs(this.leftNode.index - this.currentNode.index) < 6)
			this.addLeft();
		
		if (updateScrollMenu)
			document.getElementById("square" + this.currentNode.index).className = this.currentNode.val == 1 ? "whitesquare active" : "blacksquare active";
	};
	
	this.moveRight = function(){
		if (updateScrollMenu)
			document.getElementById("square" + this.currentNode.index).className = this.currentNode.val == 1 ? "whitesquare" : "blacksquare";
		
		this.currentNode = this.currentNode.right;
		if (Math.abs(this.rightNode.index - this.currentNode.index) < 6)
			this.addRight();
		
		if (updateScrollMenu)
			document.getElementById("square" + this.currentNode.index).className = this.currentNode.val == 1 ? "whitesquare active" : "blacksquare active";
	};
	
	this.getRules = function(ruleString){
		let tempRules = {}
		for (let i = 0; i < ruleString.length; i += 6){
			let letter = String.fromCharCode(65 + Math.trunc(i / 6));
			
			if (ruleString[i] != "-")
				tempRules[letter + "0"] = new Rule(ruleString[i], ruleString[i + 1], ruleString[i + 2]);
			else
				tempRules[letter + "0"] = new Rule("-1", "E", null);
			
			if (ruleString[i + 3] != "-")
				tempRules[letter + "1"] = new Rule(ruleString[i + 3], ruleString[i + 4], ruleString[i + 5]);
			else
				tempRules[letter + "1"] = new Rule("-1", "E", null);
		}
		return tempRules;
	};
	
	this.applyRule = function(){
		this.turnCount++;
		turnCounter.innerHTML = "Turns: " + this.turnCount;
		
		this.turns.append(new Turn(this.currentNode.val, this.currentNode.index, this.currentRule));
		
		let oldRule = document.getElementById("rule" + this.currentRule + this.currentNode.val);
		let replace = "";
		
		for (let i = 6; i < oldRule.innerHTML.length - 7; i++)
			replace += oldRule.innerHTML[i];
		
		oldRule.innerHTML = replace;
		
		let rule = this.rules[this.currentRule + this.currentNode.val];
		
		if (rule.next == null){ //if we hit the halt instruction
			halt = true;
			turnCounter.innerHTML = "Halted, Total Turns: " + this.turnCount;
			return false;
		}
		
		this.currentNode.val = rule.val; //change current nodes value
		
		if (rule.direction == "L") //move
			this.moveLeft();
		else
			this.moveRight();
		
		this.currentRule = rule.next; //go to next rule
		
		let newRule = document.getElementById("rule" + this.currentRule + this.currentNode.val);
		newRule.innerHTML = "<mark>" + newRule.innerHTML + "</mark>";
		
		if (updateScrollMenu)
			scrollMenu.scrollLeft = document.getElementById("square" + (this.currentNode.index - 6)).offsetLeft - scrollMenu.offsetLeft - 20;
		
		return true;
	};
	
	this.autoRule = function(target){
		let didithalt = false;
		
		while (this.turnCount < target){
			this.turnCount++;
			this.turns.append(new Turn(this.currentNode.val, this.currentNode.index, this.currentRule));
			
			let rule = this.rules[this.currentRule + this.currentNode.val];
			
			if (rule.next == null){
				halt = true;
				turnCounter.innerHTML = "Halted, Total Turns: " + this.turnCount;
				didithalt = true;
				break;
			}
			
			this.currentNode.val = rule.val;
			
			if (rule.direction == "L"){
				this.currentNode = this.currentNode.left;
				if (Math.abs(this.leftNode.index - this.currentNode.index) < 6){
					let newIndex = this.leftNode.index - 1;
					this.memo[newIndex] = new Node(0, newIndex, null, this.leftNode);
					this.leftNode.left = this.memo[newIndex];
					this.leftNode = this.memo[newIndex];
					this.size++;
				}
			}
			else{
				this.currentNode = this.currentNode.right;
				if (Math.abs(this.rightNode.index - this.currentNode.index) < 6){
					let newIndex = this.rightNode.index + 1;
					this.memo[newIndex] = new Node(0, newIndex, this.rightNode);
					this.rightNode.right = this.memo[newIndex];
					this.rightNode = this.memo[newIndex];
					this.size++;
				}
			}
			
			this.currentRule = rule.next;
		}
		
		if (updateScrollMenu){
			while (scrollMenu.firstChild)
				scrollMenu.firstChild.remove();
			
			let node = this.leftNode;
			while (node != null){
				if (node.index == this.currentNode.index){
					if (node.val == 0){
						const zero = document.createElement("div");
						zero.id = "square" + node.index;
						zero.className = "blacksquare active";
						scrollMenu.appendChild(zero);
					}
					else{
						const one = document.createElement("div");
						one.id = "square" + node.index;
						one.className = "whitesquare active";
						scrollMenu.appendChild(one);
					}
				}
				else{
					if (node.val == 0){
						const zero = document.createElement("div");
						zero.id = "square" + node.index;
						zero.className = "blacksquare";
						scrollMenu.appendChild(zero);
					}
					else{
						const one = document.createElement("div");
						one.id = "square" + node.index;
						one.className = "whitesquare";
						scrollMenu.appendChild(one);
					}
				}
				node = node.right;
			}
			
			scrollMenu.scrollLeft = document.getElementById("square" + (this.currentNode.index - 6)).offsetLeft - scrollMenu.offsetLeft - 20;
		}
		
		displayRules(true);
		
		
		if (!didithalt){
			turnCounter.innerHTML = "Turns: " + this.turnCount;
			
			let newRule = document.getElementById("rule" + this.currentRule + this.currentNode.val);
			newRule.innerHTML = "<mark>" + newRule.innerHTML + "</mark>";
		}
	}
	
	this.goBack = function(){
		if (this.turns.size == 0) //base case
			return;
			
		halt = false;
		
		let currentTurn = this.turns.pop();
		
		let oldRule = document.getElementById("rule" + this.currentRule + this.currentNode.val);
		
		if (oldRule.innerHTML[0] == "<"){
			let replace = "";
			
				for (let i = 6; i < oldRule.innerHTML.length - 7; i++)
					replace += oldRule.innerHTML[i];
				
			oldRule.innerHTML = replace;
		}
		
		document.getElementById("square" + this.currentNode.index).className = this.currentNode.val == 1 ? "whitesquare" : "blacksquare"; //unselect the current square

		this.currentNode = this.memo[currentTurn.index]; //move our currentNode pointer to where it needs to be
		
		this.currentNode.val = currentTurn.val; //change the value to what it should be
		this.currentRule = currentTurn.rule; //change the rule to what it should be
		
		document.getElementById("square" + this.currentNode.index).className = this.currentNode.val == 1 ? "whitesquare active" : "blacksquare active"; //select the square we are now on
		
		this.turnCount--;
		turnCounter.innerHTML = "Turns: " + this.turnCount;
		
		let newRule = document.getElementById("rule" + this.currentRule + this.currentNode.val);
		newRule.innerHTML = "<mark>" + newRule.innerHTML + "</mark>";
		
		if (updateScrollMenu)
			scrollMenu.scrollLeft = document.getElementById("square" + (this.currentNode.index - 6)).offsetLeft - scrollMenu.offsetLeft - 20;
	}
}

function Node(Val, Index, Left = null, Right = null){
	this.val = Val;
	this.index = Index;
	this.left = Left;
	this.right = Right;
}

function Rule(Val, Direction, Next){
	this.val = parseInt(Val);
	this.direction = Direction;
	this.next = Next;
}

function validRuleString(ruleString){
	if (ruleString.length == 0 || ruleString.length % 6 != 0)
		return false;
	
	let maxLetter = 64 + Math.trunc(ruleString.length / 6);
	
	for (let i = 0; i < ruleString.length; i += 3){ //go rule by rule
		if (!(ruleString[i] == "-" && ruleString[i + 1] == "-" && ruleString[i + 2] == "-")){//check if we are not on an end statement
			if (ruleString[i] != "1" && ruleString[i] != "0" && ruleString[i] != "-") //check if value is not 1 or 0
				return false;
			
			if (ruleString[i + 1] != "L" && ruleString[i + 1] != "R" && ruleString[i + 1] != "-")//check if direction is not left or right
				return false;
				
			if (!(65 <= ruleString[i + 2].charCodeAt(0) && ruleString[i + 2].charCodeAt(0) <= maxLetter) && ruleString[i + 2] != "-")//check if next rule is not within range of rules (e.g if rules range from A-C, E would be invalid as it is out of bounds)
				return false;
		}
	}
	
	return true;
}

function displayRules(usingAutoRules = false){
		let temp = document.getElementById("listofrules") ;
		if (temp != null)
			document.body.removeChild(temp);
		
		let newDiv = document.createElement("div");
		newDiv.id = "listofrules";
		
		for (let [key, value] of Object.entries(machine.rules)){
			let tempP = document.createElement("p");
			tempP.id = "rule" + key;
			if (value.next != null)
				tempP.innerHTML = key + ",  " + value.val + " " + value.direction + " " + value.next + "\r\n";
			else
				tempP.innerHTML = key + ",  " + " --- \r\n";
			
			tempP.className = "rule";
			newDiv.appendChild(tempP);
		}
		
		document.body.appendChild(newDiv);
		
		if (!usingAutoRules){
			let firstRule = document.getElementById("ruleA0");
			firstRule.innerHTML = "<mark>" + firstRule.innerHTML + "</mark>";
		}
}

function Turn(Val, Index, Rule){
	this.val = Val;
	this.index = Index;
	this.rule = Rule;
}

function Queue(){ //custom queue implementation because i dont think javascript has a thing with the features i want
	this.size = 0;
	this.lastNode = null;
	this.firstNode = null;
	
	this.customNode = function(Thing, Prev = null, Next = null){
		this.thing = Thing;
		this.prev = Prev;
		this.next = Next;
	}
	
	this.append = function(Thing){
		let newNode = new this.customNode(Thing);
		if (this.size == 0){
			this.lastNode = newNode; //as this is the first node, it is both the first and last node so im just setting that to be the case
			this.firstNode = newNode;
		}
		else{
			this.firstNode.next = newNode; //just creating the bridge between the two nodes
			newNode.prev = this.firstNode;
			
			this.firstNode = newNode; //setting the firstnode to be the new first node
		}
		
		this.size++;
		
		if (this.size > 1000000){//a limit is set as to how many moves you can move back as to ensure that the memory limit is not hit
			this.dequeue();
		}
	}
	
	this.dequeue = function(){
		if (this.size == 0){
			throw {name : "EmptyQueue", message : "You tried dequeuing or popping an empty queue"}; 
		}
		let res = this.lastNode.thing; //we want to keep and return this
		
		let temp = this.lastNode.next; //just moving the pointer lastnode to the next node, and then removing the last node in the queue
		delete this.lastNode;
		this.lastNode = temp;
		
		this.size--;
		return res;
	}
	
	this.pop = function(){
		if (this.size == 0){
			throw {name : "EmptyQueue", message : "You tried dequeuing or popping an empty queue"}; 
		}
		let res = this.firstNode.thing; //we want to keep and return this
		
		let temp = this.firstNode.prev; //same thing with the dequeue function, just this time with the start of the queue
		delete this.firstNode;
		this.firstNode = temp;
		
		this.size--;
		return res;
	}
}

