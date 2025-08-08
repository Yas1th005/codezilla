extends Control
class_name InteractionPrompt

## UI system for displaying interaction prompts (like "Press E to interact")

@export var fade_duration: float = 0.2

# Node references
@onready var prompt_container: VBoxContainer = $PromptContainer
@onready var prompt_panel: Panel = $PromptContainer/PromptPanel
@onready var prompt_label: Label = $PromptContainer/PromptPanel/PromptLabel

# State
var is_showing: bool = false

func _ready() -> void:
	# Initially hide the prompt
	hide_prompt_instant()

func show_prompt(message: String) -> void:
	"""Show interaction prompt with the given message"""
	prompt_label.text = message
	
	if not is_showing:
		is_showing = true
		prompt_container.modulate.a = 0.0
		prompt_container.visible = true
		
		# Fade in
		var tween = create_tween()
		tween.tween_property(prompt_container, "modulate:a", 1.0, fade_duration)

func hide_prompt() -> void:
	"""Hide interaction prompt with fade out"""
	if is_showing:
		is_showing = false
		
		# Fade out
		var tween = create_tween()
		tween.tween_property(prompt_container, "modulate:a", 0.0, fade_duration)
		tween.tween_callback(func(): prompt_container.visible = false)

func hide_prompt_instant() -> void:
	"""Hide prompt immediately without animation"""
	is_showing = false
	prompt_container.visible = false
	prompt_container.modulate.a = 0.0

# Static reference for global access
static var instance: InteractionPrompt

func _enter_tree() -> void:
	InteractionPrompt.instance = self

func _exit_tree() -> void:
	if InteractionPrompt.instance == self:
		InteractionPrompt.instance = null

# Static methods for easy access from anywhere
static func show_message(message: String) -> void:
	if InteractionPrompt.instance:
		InteractionPrompt.instance.show_prompt(message)

static func hide_message() -> void:
	if InteractionPrompt.instance:
		InteractionPrompt.instance.hide_prompt()
