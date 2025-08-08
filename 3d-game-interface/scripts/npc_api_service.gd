extends Node
class_name NPCAPIService

## Service for handling NPC dialogue API requests

signal dialogue_received(dialogue_data: Dictionary)
signal api_error(error_message: String)

const API_URL = "https://npcrafter.onrender.com/preview-dialogue"
const REQUEST_TIMEOUT = 60.0
const NPC_TRAITS_FILE = "res://data/npc_traits.json"
const NPC_SITTING_TRAITS_FILE = "res://data/npc_sitting_traits.json"

var http_request: HTTPRequest
var npc_traits: Dictionary = {}
var npc_sitting_traits: Dictionary = {}
var player_stats: Dictionary = {}
var current_npc_type: String = "standing"  # Track which NPC is currently active

func _ready() -> void:
	# Create HTTP request node
	http_request = HTTPRequest.new()
	add_child(http_request)

	# Configure HTTP request
	http_request.timeout = REQUEST_TIMEOUT
	http_request.request_completed.connect(_on_request_completed)

	# Load NPC traits and initialize player stats
	load_npc_traits()
	load_npc_sitting_traits()
	initialize_player_stats()

	print("NPCAPIService: Initialized")

func load_npc_traits() -> void:
	"""Load NPC traits from JSON file"""
	if FileAccess.file_exists(NPC_TRAITS_FILE):
		var file = FileAccess.open(NPC_TRAITS_FILE, FileAccess.READ)
		if file:
			var json_string = file.get_as_text()
			file.close()

			var json = JSON.new()
			var parse_result = json.parse(json_string)
			if parse_result == OK:
				npc_traits = json.data
				var npc_name = npc_traits.get("name", "Unknown") if npc_traits.has("name") else "Unknown"
				print("NPCAPIService: Loaded NPC traits - ", npc_name)
			else:
				print("NPCAPIService Error: Failed to parse NPC traits JSON")
				npc_traits = {}
		else:
			print("NPCAPIService Error: Could not open NPC traits file")
			npc_traits = {}
	else:
		print("NPCAPIService Error: NPC traits file not found: ", NPC_TRAITS_FILE)
		npc_traits = {}

func load_npc_sitting_traits() -> void:
	"""Load sitting NPC traits from JSON file"""
	if FileAccess.file_exists(NPC_SITTING_TRAITS_FILE):
		var file = FileAccess.open(NPC_SITTING_TRAITS_FILE, FileAccess.READ)
		if file:
			var json_string = file.get_as_text()
			file.close()

			var json = JSON.new()
			var parse_result = json.parse(json_string)
			if parse_result == OK:
				npc_sitting_traits = json.data
				var npc_name = npc_sitting_traits.get("name", "Unknown") if npc_sitting_traits.has("name") else "Unknown"
				print("NPCAPIService: Loaded sitting NPC traits - ", npc_name)
			else:
				print("NPCAPIService Error: Failed to parse sitting NPC traits JSON")
				npc_sitting_traits = {}
		else:
			print("NPCAPIService Error: Could not open sitting NPC traits file")
			npc_sitting_traits = {}
	else:
		print("NPCAPIService Error: Sitting NPC traits file not found: ", NPC_SITTING_TRAITS_FILE)
		npc_sitting_traits = {}

func initialize_player_stats() -> void:
	"""Initialize hardcoded player stats"""
	player_stats = {
		"health": 75,
		"inventory": [
			{"item": "sword", "quantity": 1},
			{"item": "health_potion", "quantity": 3}
		],
		"completed_quests": ["Rescue the villager", "Defeat the goblin camp"],
		"battle_logs": [
			{"enemy": "Goblin", "outcome": "victory", "timestamp": "2023-08-07T10:15:30"}
		],
		"achievements": ["First blood", "Explorer"],
		"location": "Forest of Whispers"
	}
	print("NPCAPIService: Initialized player stats")

func send_message(message: String, npc_type: String = "standing") -> void:
	"""Send player message to the API and get NPC response"""
	if not message or message.strip_edges().length() == 0:
		api_error.emit("Empty message cannot be sent")
		return

	# Set current NPC type for this request
	current_npc_type = npc_type

	print("NPCAPIService: Starting API request for message: '", message, "'")

	# Select appropriate NPC traits based on type
	var selected_traits: Dictionary
	if current_npc_type == "sitting":
		selected_traits = npc_sitting_traits
		print("NPCAPIService: Using sitting NPC traits")
	else:
		selected_traits = npc_traits
		print("NPCAPIService: Using standing NPC traits")

	# Prepare JSON body with NPC traits, player message, and player stats
	var json_body = {
		"npc_traits": selected_traits,
		"message": message.strip_edges(),
		"player_stats": player_stats
	}

	var json_string = JSON.stringify(json_body)
	print("NPCAPIService: Sending request body:")
	print(json_string)
	
	# Prepare headers
	var headers = [
		"Content-Type: application/json",
		"Accept: application/json"
	]
	
	# Send POST request
	var error = http_request.request(API_URL, headers, HTTPClient.METHOD_POST, json_string)
	
	if error != OK:
		var error_msg = "Failed to send HTTP request. Error code: " + str(error)
		print("NPCAPIService Error: ", error_msg)
		api_error.emit(error_msg)

func _on_request_completed(result: int, response_code: int, headers: PackedStringArray, body: PackedByteArray) -> void:
	"""Handle the API response"""
	print("NPCAPIService: Request completed - Result: ", result, " Response Code: ", response_code)
	
	# Check for HTTP errors
	if response_code != 200:
		var error_msg = "API request failed with response code: " + str(response_code)
		print("NPCAPIService Error: ", error_msg)
		api_error.emit(error_msg)
		return
	
	# Check for request errors
	if result != HTTPRequest.RESULT_SUCCESS:
		var error_msg = "HTTP request failed with result: " + str(result)
		print("NPCAPIService Error: ", error_msg)
		api_error.emit(error_msg)
		return
	
	# Parse JSON response
	var json = JSON.new()
	var body_string = body.get_string_from_utf8()
	print("NPCAPIService: Raw API response:")
	print("==================================================")
	print("==================================================")

	var parse_result = json.parse(body_string)
	if parse_result != OK:
		var error_msg = "Failed to parse JSON response: " + str(parse_result)
		print("NPCAPIService Error: ", error_msg)
		api_error.emit(error_msg)
		return

	var response_data = json.data
	print("NPCAPIService: Parsed response data:")
	
	# Validate response structure (new format)
	if not response_data.has("dialogue"):
		var error_msg = "Invalid API response: missing 'dialogue'"
		print("NPCAPIService Error: ", error_msg)
		api_error.emit(error_msg)
		return

	var dialogue = response_data["dialogue"]

	if not dialogue.has("text"):
		var error_msg = "Invalid API response: dialogue missing 'text'"
		print("NPCAPIService Error: ", error_msg)
		api_error.emit(error_msg)
		return
	
	print("NPCAPIService: Successfully parsed response")
	print("NPCAPIService: Dialogue received:")
	var text = dialogue.get("text", "No text") if dialogue.has("text") else "No text"
	var emotion = dialogue.get("emotion", "No emotion") if dialogue.has("emotion") else "No emotion"
	var audio_base64 = response_data.get("audio_base64", "") if response_data.has("audio_base64") else ""

	print("  Text: ", text)
	print("  Emotion: ", emotion)
	if audio_base64 != "":
		print("  Audio Base64: [", audio_base64.length(), " characters]")
	print("  Audio Status: ", response_data.get("audio_generation_status", "Unknown"))
	print("  Audio Format: ", response_data.get("audio_format", "Unknown"))

	dialogue_received.emit(response_data)

# Singleton instance
static var instance: NPCAPIService

func _enter_tree() -> void:
	NPCAPIService.instance = self

func _exit_tree() -> void:
	if NPCAPIService.instance == self:
		NPCAPIService.instance = null

# Static method for easy access
static func send_player_message(message: String) -> void:
	if NPCAPIService.instance:
		NPCAPIService.instance.send_message(message)
	else:
		print("NPCAPIService Error: No instance available")

# Static method to reload NPC traits
static func reload_npc_traits() -> void:
	if NPCAPIService.instance:
		NPCAPIService.instance.load_npc_traits()
		print("NPCAPIService: NPC traits reloaded")
	else:
		print("NPCAPIService Error: No instance available")
