extends CharacterBody3D
class_name NPCSitting

## NPC Sitting Character with dynamic dialogue system
## This script handles all NPC interactions, animations, and API communication for the sitting NPC

@export_group("NPC Settings")
## Distance at which NPC detects and greets the player
@export var detection_radius: float = 3.0
## How long the NPC talks before returning to idle
@export var talking_duration: float = 3.0
## Initial greeting message to display
@export var greeting_message: String = "Greetings, friend! Please, have a seat and rest a while."
## Should NPC face the player when in range
@export var face_player: bool = true
## Speed at which NPC rotates to face player (radians per second)
@export var rotation_speed: float = 5.0

@export_group("Dialogue Choices")
## Text for dialogue choice 1
@export var choice1_text: String = "Hello! How are you today?"
## Text for dialogue choice 2
@export var choice2_text: String = "What do you do here?"
## Text for dialogue choice 3
@export var choice3_text: String = "Goodbye for now."

@export_group("NPC Responses")
## NPC response to choice 1
@export var response1_text: String = "I'm doing well, thank you for asking! It's peaceful here."
## NPC response to choice 2
@export var response2_text: String = "I'm a scholar who studies ancient texts. I find sitting helps me think."
## NPC response to choice 3
@export var response3_text: String = "Farewell, traveler! May your journey be safe."
## NPC response to custom text input
@export var custom_response_text: String = "That's interesting! I appreciate you sharing your thoughts with me."

@export_group("Animation Settings")
## Name of the idle animation in the AnimationPlayer
@export var idle_animation_name: String = "Sitting(1)"
## Name of the talking animation in the AnimationPlayer
@export var talking_animation_name: String = "SittingTalking"

# Internal state
var player_in_range: bool = false
var is_talking: bool = false
var is_thinking: bool = false
var talking_timer: float = 0.0
var thinking_timer: float = 0.0
var can_interact: bool = false
var showing_choices: bool = false
var player_node: Node3D = null
var original_rotation: float = 0.0
var waiting_for_api: bool = false
var api_service: Node = null
var audio_player: AudioStreamPlayer = null
var is_playing_audio: bool = false

# Node references
@onready var animation_player: AnimationPlayer = $CharacterModel/AnimationPlayer
@onready var detection_area: Area3D = $DetectionArea
@onready var detection_collision: CollisionShape3D = $DetectionArea/CollisionShape3D

func _ready() -> void:
	setup_detection_area()
	start_idle_animation()
	
	# Store original rotation
	original_rotation = rotation.y
	
	# Initialize API service
	setup_api_service()
	
	# Setup audio components
	setup_audio_system()
	
	# Connect area signals
	if detection_area:
		detection_area.body_entered.connect(_on_body_entered)
		detection_area.body_exited.connect(_on_body_exited)

func _physics_process(delta: float) -> void:
	handle_talking_timer(delta)
	handle_thinking_timer(delta)
	update_animation_state()
	handle_interaction_input()
	handle_face_player(delta)

func setup_detection_area() -> void:
	"""Setup the detection area for proximity sensing"""
	if detection_area and detection_collision:
		# Check if we already have a sphere shape, otherwise create one
		var sphere_shape: SphereShape3D
		if detection_collision.shape is SphereShape3D:
			sphere_shape = detection_collision.shape as SphereShape3D
		else:
			sphere_shape = SphereShape3D.new()
			detection_collision.shape = sphere_shape
		
		# Set the radius to ensure it's exactly 3 meters
		sphere_shape.radius = detection_radius
		
		# Configure the area
		detection_area.monitoring = true
		detection_area.monitorable = false
		
		print("NPC Sitting: Detection area configured as sphere with radius: ", detection_radius, " meters")

func setup_api_service() -> void:
	"""Setup the API service for dynamic dialogue"""
	# Find the global API service
	api_service = get_node_or_null("/root/Main/NPCAPIService")
	
	if api_service and api_service.has_signal("dialogue_received"):
		# Connect signals
		api_service.dialogue_received.connect(_on_dialogue_received)
		api_service.api_error.connect(_on_api_error)
		print("NPC Sitting: Connected to global API service")
	else:
		print("NPC Sitting Error: Could not find global API service")

func setup_audio_system() -> void:
	"""Setup audio player for base64 audio playback"""
	# Create audio player
	audio_player = AudioStreamPlayer.new()
	add_child(audio_player)
	audio_player.finished.connect(_on_audio_finished)
	
	print("NPC Sitting: Audio system initialized")



func start_idle_animation() -> void:
	"""Start playing the idle animation on loop"""
	if animation_player and animation_player.has_animation(idle_animation_name):
		animation_player.play(idle_animation_name, -1, 1.0, false)
		# Set the animation to loop
		var animation = animation_player.get_animation(idle_animation_name)
		if animation:
			animation.loop_mode = Animation.LOOP_LINEAR
		print("NPC Sitting: Started idle animation: ", idle_animation_name)
	else:
		print("NPC Sitting Warning: Idle animation '", idle_animation_name, "' not found!")
		if animation_player:
			print("Available animations: ", animation_player.get_animation_list())



func start_talking_animation() -> void:
	"""Start playing the talking animation on loop"""
	if animation_player and animation_player.has_animation(talking_animation_name):
		animation_player.play(talking_animation_name, -1, 1.0, false)
		# Set the animation to loop
		var animation = animation_player.get_animation(talking_animation_name)
		if animation:
			animation.loop_mode = Animation.LOOP_LINEAR
		print("NPC Sitting: Started talking animation: ", talking_animation_name)
	else:
		print("NPC Sitting Warning: Talking animation '", talking_animation_name, "' not found!")
		if animation_player:
			print("Available animations: ", animation_player.get_animation_list())

func handle_talking_timer(delta: float) -> void:
	"""Handle the talking duration timer"""
	if is_talking:
		talking_timer += delta
		# Only stop talking if not playing audio, or if audio has finished
		if not is_playing_audio and talking_timer >= talking_duration:
			stop_talking()

func handle_thinking_timer(delta: float) -> void:
	"""Handle the thinking duration timer"""
	if is_thinking:
		thinking_timer += delta
		# Thinking animation continues until API response or timeout

func update_animation_state() -> void:
	"""Update animation based on current state"""
	if is_talking and animation_player.current_animation != talking_animation_name:
		start_talking_animation()
	elif not is_talking and animation_player.current_animation != idle_animation_name:
		start_idle_animation()

func start_thinking() -> void:
	"""Start thinking state (uses idle animation)"""
	is_thinking = true
	thinking_timer = 0.0
	start_idle_animation()
	print("NPC Sitting: Started thinking (using idle animation)")

func stop_thinking() -> void:
	"""Stop thinking and return to idle"""
	is_thinking = false
	thinking_timer = 0.0
	start_idle_animation()
	print("NPC Sitting: Finished thinking, returning to idle")

func stop_talking() -> void:
	"""Stop talking and return to idle"""
	is_talking = false
	talking_timer = 0.0
	start_idle_animation()
	print("NPC Sitting: Finished talking, returning to idle")

func interact_with_player() -> void:
	"""Handle player interaction when E is pressed"""
	if can_interact and not is_talking and not is_thinking and not showing_choices and not waiting_for_api:
		# Show hardcoded initial greeting (no API call)
		print("NPC Sitting: Showing hardcoded greeting")

		# Show hardcoded greeting message
		DialogueUI.show_message(greeting_message)
		print("NPC Sitting: ", greeting_message)

		# Start talking animation
		is_talking = true
		talking_timer = 0.0
		start_talking_animation()

		# Wait for talking to finish, then show choices immediately
		await get_tree().create_timer(talking_duration).timeout
		show_dialogue_choices()

func handle_interaction_input() -> void:
	"""Check for E key press when player can interact"""
	if can_interact and Input.is_action_just_pressed("interact") and not showing_choices and not is_thinking and not waiting_for_api:
		print("NPC Sitting: E key pressed - starting interaction")
		interact_with_player()
	elif Input.is_action_just_pressed("interact"):
		# Debug why interaction isn't working
		print("NPC Sitting: E pressed but interaction blocked - can_interact:", can_interact, " showing_choices:", showing_choices, " is_thinking:", is_thinking, " waiting_for_api:", waiting_for_api)

func show_dialogue_choices() -> void:
	"""Show dialogue choices to the player"""
	showing_choices = true

	# Release mouse for UI interaction
	Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)

	# Show dialogue choices with this NPC as the target
	DialogueChoices.show_dialogue_choices(self, choice1_text, choice2_text, choice3_text)
	print("NPC Sitting: Showing dialogue choices")

func handle_player_choice(choice_index: int, choice_text: String) -> void:
	"""Handle the player's dialogue choice"""
	showing_choices = false
	print("NPC Sitting: Player chose (index ", choice_index, "): '", choice_text, "'")

	# Start thinking animation while waiting for API response
	print("NPC Sitting: Starting thinking animation and API request")
	start_thinking()
	waiting_for_api = true

	# Send message to API
	if api_service and api_service.has_method("send_message"):
		print("NPC Sitting: Sending message to API service")
		api_service.send_message(choice_text, "sitting")
	else:
		print("NPC Sitting Error: API service not available")
		_on_api_error("API service not available")

func handle_face_player(delta: float) -> void:
	"""Make NPC face the player when in range"""
	if face_player and player_in_range and player_node:
		# Calculate direction to player
		var direction_to_player = (player_node.global_position - global_position).normalized()
		var target_rotation = atan2(direction_to_player.x, direction_to_player.z)

		# Smoothly rotate towards player
		var angle_diff = angle_difference(target_rotation, rotation.y)
		if abs(angle_diff) > 0.01:  # Small threshold to avoid jittering
			rotation.y = lerp_angle(rotation.y, target_rotation, rotation_speed * delta)

func _on_dialogue_received(dialogue_data: Dictionary) -> void:
	"""Handle successful API response"""
	waiting_for_api = false
	stop_thinking()

	# Extract dialogue from new API response format
	var dialogue = dialogue_data.get("dialogue", {})
	if dialogue.has("text"):
		var response_text = dialogue.get("text", "I'm not sure how to respond to that.")
		var audio_base64 = dialogue_data.get("audio_base64", "")  # Extract from root level

		# For regular responses, show the API-generated text and play audio
		DialogueUI.show_message(response_text)
		print("NPC Sitting responds (API): ", response_text)

		# Start talking animation
		is_talking = true
		talking_timer = 0.0
		start_talking_animation()

		# Play audio if base64 data is available
		if audio_base64 != "":
			# Stop auto-hide timer for dialogue - we'll hide it when audio ends
			DialogueUI.stop_auto_hide_timer()
			play_audio_from_base64(audio_base64)
		else:
			print("NPC Sitting: No audio base64 data provided")
			# No audio, so talking and dialogue will stop after normal duration
			is_playing_audio = false
	else:
		_on_api_error("No dialogue text in API response")

func _on_api_error(error_message: String) -> void:
	"""Handle API error"""
	waiting_for_api = false
	stop_thinking()

	print("NPC Sitting API Error: ", error_message)

	# Fallback to a generic response
	var fallback_response = "I'm having trouble finding the right words right now. Perhaps we could talk about something else?"
	DialogueUI.show_message(fallback_response)
	print("NPC Sitting responds (fallback): ", fallback_response)

	# Start talking animation for the fallback response (no audio, so normal duration)
	is_talking = true
	talking_timer = 0.0
	is_playing_audio = false
	start_talking_animation()

func play_audio_from_base64(audio_base64: String) -> void:
	"""Play audio directly from base64 data"""
	print("NPC Sitting: Playing audio from base64 data (", audio_base64.length(), " characters)")

	# Decode base64 to bytes
	var audio_bytes = Marshalls.base64_to_raw(audio_base64)

	if audio_bytes.size() > 0:
		# Create audio stream from bytes
		var audio_stream = AudioStreamMP3.new()
		audio_stream.data = audio_bytes
		audio_player.stream = audio_stream

		# Set audio playing flag and start playback
		is_playing_audio = true
		audio_player.play()

		print("NPC Sitting: Audio playing from base64 data")
	else:
		print("NPC Sitting Error: Failed to decode base64 audio data")

func _on_audio_finished() -> void:
	"""Called when audio playback finishes"""
	print("NPC Sitting: Audio playback finished")

	# Clear audio playing flag and stop talking animation
	is_playing_audio = false
	if is_talking:
		stop_talking()

	# Hide dialogue when audio ends
	DialogueUI.hide_message()

func enable_interaction() -> void:
	"""Enable interaction when player is in range"""
	can_interact = true
	# Show interaction prompt
	InteractionPrompt.show_message("Press E to interact")
	print("NPC Sitting: Interaction enabled - Press E to interact")

func disable_interaction() -> void:
	"""Disable interaction when player leaves range"""
	can_interact = false
	showing_choices = false
	is_thinking = false
	thinking_timer = 0.0
	waiting_for_api = false
	player_node = null
	is_playing_audio = false

	# Stop audio if playing
	if audio_player and audio_player.playing:
		audio_player.stop()

	# Hide all UI elements
	InteractionPrompt.hide_message()
	DialogueChoices.hide_dialogue_choices()
	DialogueUI.hide_message()

	print("NPC Sitting: Interaction disabled - player left range")

func _on_body_entered(body: Node3D) -> void:
	"""Called when a body enters the detection area"""
	# Check if it's the player (ProtoController)
	if body.name == "ProtoController" or body.is_in_group("player"):
		var distance = global_position.distance_to(body.global_position)
		player_in_range = true
		player_node = body  # Store reference to player
		enable_interaction()
		print("NPC Sitting: Player entered 3m detection sphere - Distance: ", "%.2f" % distance, "m - can interact")

func _on_body_exited(body: Node3D) -> void:
	"""Called when a body exits the detection area"""
	# Check if it's the player (ProtoController)
	if body.name == "ProtoController" or body.is_in_group("player"):
		var distance = global_position.distance_to(body.global_position)
		player_in_range = false
		player_node = null  # Clear player reference
		disable_interaction()
		print("NPC Sitting: Player left 3m detection sphere - Distance: ", "%.2f" % distance, "m")

# Debug function to manually trigger interaction
func debug_interact() -> void:
	interact_with_player()

# Helper function to calculate the shortest angle difference
func angle_difference(target: float, current: float) -> float:
	var diff = target - current
	while diff > PI:
		diff -= 2 * PI
	while diff < -PI:
		diff += 2 * PI
	return diff
