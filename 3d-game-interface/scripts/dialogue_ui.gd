extends Control
class_name DialogueUI

## UI system for displaying NPC dialogue messages

@export var fade_duration: float = 0.3
@export var display_duration: float = 3.0

# Node references
@onready var dialogue_container: VBoxContainer = $DialogueContainer
@onready var dialogue_panel: Panel = $DialogueContainer/DialoguePanel
@onready var dialogue_label: Label = $DialogueContainer/DialoguePanel/DialogueLabel

# State
var is_showing: bool = false
var hide_timer: Timer

func _ready() -> void:
	# Initially hide the dialogue
	hide_dialogue_instant()
	
	# Create and setup timer
	hide_timer = Timer.new()
	hide_timer.wait_time = display_duration
	hide_timer.one_shot = true
	hide_timer.timeout.connect(_on_hide_timer_timeout)
	add_child(hide_timer)

func show_dialogue(message: String) -> void:
	"""Show dialogue with the given message"""
	dialogue_label.text = message
	
	if not is_showing:
		is_showing = true
		dialogue_container.modulate.a = 0.0
		dialogue_container.visible = true
		
		# Fade in
		var tween = create_tween()
		tween.tween_property(dialogue_container, "modulate:a", 1.0, fade_duration)
	
	# Reset the hide timer
	hide_timer.stop()
	hide_timer.start()

func hide_dialogue() -> void:
	"""Hide dialogue with fade out"""
	if is_showing:
		is_showing = false
		
		# Fade out
		var tween = create_tween()
		tween.tween_property(dialogue_container, "modulate:a", 0.0, fade_duration)
		tween.tween_callback(func(): dialogue_container.visible = false)

func hide_dialogue_instant() -> void:
	"""Hide dialogue immediately without animation"""
	is_showing = false
	dialogue_container.visible = false
	dialogue_container.modulate.a = 0.0

func _on_hide_timer_timeout() -> void:
	"""Called when the display timer expires"""
	hide_dialogue()

func stop_auto_hide() -> void:
	"""Stop the auto-hide timer (for audio-synced dialogue)"""
	hide_timer.stop()

func force_hide() -> void:
	"""Force hide the dialogue immediately"""
	hide_timer.stop()
	hide_dialogue()

# Static reference for global access
static var instance: DialogueUI

func _enter_tree() -> void:
	DialogueUI.instance = self

func _exit_tree() -> void:
	if DialogueUI.instance == self:
		DialogueUI.instance = null

# Static methods for easy access from anywhere
static func show_message(message: String) -> void:
	if DialogueUI.instance:
		DialogueUI.instance.show_dialogue(message)

static func stop_auto_hide_timer() -> void:
	if DialogueUI.instance:
		DialogueUI.instance.stop_auto_hide()

static func hide_message() -> void:
	if DialogueUI.instance:
		DialogueUI.instance.force_hide()
