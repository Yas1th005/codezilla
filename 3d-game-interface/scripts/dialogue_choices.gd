extends Control
class_name DialogueChoices

## UI system for displaying dialogue choices to the player

@export var fade_duration: float = 0.3

# Node references
@onready var choices_container: VBoxContainer = $ChoicesContainer
@onready var title_label: Label = $ChoicesContainer/TitleLabel
@onready var choice1_button: Button = $ChoicesContainer/Choice1
@onready var choice2_button: Button = $ChoicesContainer/Choice2
@onready var choice3_button: Button = $ChoicesContainer/Choice3
@onready var text_input: LineEdit = $ChoicesContainer/TextInputContainer/TextInput
@onready var send_button: Button = $ChoicesContainer/TextInputContainer/SendButton

# State
var is_showing: bool = false
var current_npc: Node = null
var player_controller: Node = null

# Signals
signal choice_selected(choice_index: int, choice_text: String)

func _ready() -> void:
	# Initially hide the choices
	hide_choices_instant()

	# Find the player controller
	find_player_controller()

	# Connect button signals
	choice1_button.pressed.connect(_on_choice1_pressed)
	choice2_button.pressed.connect(_on_choice2_pressed)
	choice3_button.pressed.connect(_on_choice3_pressed)
	send_button.pressed.connect(_on_send_button_pressed)
	text_input.text_submitted.connect(_on_text_submitted)

	# Connect text input focus signals
	text_input.focus_entered.connect(_on_text_input_focus_entered)
	text_input.focus_exited.connect(_on_text_input_focus_exited)

func find_player_controller() -> void:
	"""Find the ProtoController in the scene"""
	# Look for ProtoController by name or group
	var players = get_tree().get_nodes_in_group("player")
	if players.size() > 0:
		player_controller = players[0]
	else:
		# Fallback: search by name
		player_controller = get_tree().get_first_node_in_group("player")
		if not player_controller:
			player_controller = get_node_or_null("/root/Main/ProtoController")

	if player_controller:
		print("DialogueChoices: Found player controller: ", player_controller.name)
	else:
		print("DialogueChoices: Warning - Could not find player controller")

func show_choices(npc: Node, choice1: String, choice2: String, choice3: String, title: String = "Choose your response:") -> void:
	"""Show dialogue choices for the given NPC"""
	current_npc = npc

	# Set the choice texts
	title_label.text = title
	choice1_button.text = choice1
	choice2_button.text = choice2
	choice3_button.text = choice3

	# Clear text input
	text_input.text = ""
	
	if not is_showing:
		is_showing = true
		choices_container.modulate.a = 0.0
		choices_container.visible = true

		# Release mouse for UI interaction using player controller
		if player_controller and player_controller.has_method("release_mouse"):
			player_controller.release_mouse()
		else:
			# Fallback to direct input control
			Input.set_mouse_mode(Input.MOUSE_MODE_VISIBLE)

		# Fade in
		var tween = create_tween()
		tween.tween_property(choices_container, "modulate:a", 1.0, fade_duration)

func hide_choices() -> void:
	"""Hide dialogue choices with fade out"""
	if is_showing:
		is_showing = false
		current_npc = null

		# Re-enable player movement
		enable_player_movement()

		# Recapture mouse for first-person camera using player controller
		if player_controller and player_controller.has_method("capture_mouse"):
			player_controller.capture_mouse()
		else:
			# Fallback to direct input control
			Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

		# Fade out
		var tween = create_tween()
		tween.tween_property(choices_container, "modulate:a", 0.0, fade_duration)
		tween.tween_callback(func(): choices_container.visible = false)

func hide_choices_instant() -> void:
	"""Hide choices immediately without animation"""
	is_showing = false
	current_npc = null
	choices_container.visible = false
	choices_container.modulate.a = 0.0

	# Re-enable player movement
	enable_player_movement()

	# Recapture mouse for first-person camera using player controller
	if player_controller and player_controller.has_method("capture_mouse"):
		player_controller.capture_mouse()
	else:
		# Fallback to direct input control
		Input.set_mouse_mode(Input.MOUSE_MODE_CAPTURED)

func _on_choice1_pressed() -> void:
	"""Handle choice 1 selection"""
	if current_npc and current_npc.has_method("handle_player_choice"):
		choice_selected.emit(0, choice1_button.text)
		current_npc.handle_player_choice(0, choice1_button.text)
	hide_choices()

func _on_choice2_pressed() -> void:
	"""Handle choice 2 selection"""
	if current_npc and current_npc.has_method("handle_player_choice"):
		choice_selected.emit(1, choice2_button.text)
		current_npc.handle_player_choice(1, choice2_button.text)
	hide_choices()

func _on_choice3_pressed() -> void:
	"""Handle choice 3 selection"""
	if current_npc and current_npc.has_method("handle_player_choice"):
		choice_selected.emit(2, choice3_button.text)
		current_npc.handle_player_choice(2, choice3_button.text)
	hide_choices()

func _on_send_button_pressed() -> void:
	"""Handle send button press for custom text input"""
	_send_custom_text()

func _on_text_submitted(text: String) -> void:
	"""Handle Enter key press in text input"""
	_send_custom_text()

func _send_custom_text() -> void:
	"""Send the custom text input to the NPC"""
	var custom_text = text_input.text.strip_edges()
	if custom_text.length() > 0 and current_npc and current_npc.has_method("handle_player_choice"):
		choice_selected.emit(3, custom_text)  # Use index 3 for custom text
		current_npc.handle_player_choice(3, custom_text)
		hide_choices()

func _on_text_input_focus_entered() -> void:
	"""Called when text input gains focus - disable player movement"""
	print("DialogueChoices: Text input focused - disabling player movement")
	disable_player_movement()

func _on_text_input_focus_exited() -> void:
	"""Called when text input loses focus - enable player movement"""
	print("DialogueChoices: Text input unfocused - enabling player movement")
	enable_player_movement()

func disable_player_movement() -> void:
	"""Disable player movement controls"""
	if player_controller:
		# Store original values and disable movement
		if "can_move" in player_controller:
			player_controller.can_move = false
		if "can_jump" in player_controller:
			player_controller.can_jump = false
		if "can_sprint" in player_controller:
			player_controller.can_sprint = false

func enable_player_movement() -> void:
	"""Enable player movement controls"""
	if player_controller:
		# Restore movement capabilities
		if "can_move" in player_controller:
			player_controller.can_move = true
		if "can_jump" in player_controller:
			player_controller.can_jump = true
		if "can_sprint" in player_controller:
			player_controller.can_sprint = true

# Static reference for global access
static var instance: DialogueChoices

func _enter_tree() -> void:
	DialogueChoices.instance = self

func _exit_tree() -> void:
	if DialogueChoices.instance == self:
		DialogueChoices.instance = null

# Static methods for easy access from anywhere
static func show_dialogue_choices(npc: Node, choice1: String, choice2: String, choice3: String, title: String = "Choose your response:") -> void:
	if DialogueChoices.instance:
		DialogueChoices.instance.show_choices(npc, choice1, choice2, choice3, title)

static func hide_dialogue_choices() -> void:
	if DialogueChoices.instance:
		DialogueChoices.instance.hide_choices()
