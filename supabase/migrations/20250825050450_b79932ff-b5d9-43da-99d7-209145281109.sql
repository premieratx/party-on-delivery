-- Log the scroll behavior implementation and rules
INSERT INTO system_audit_log (
  event_type,
  service_name,
  operation,
  request_data,
  created_at
) VALUES (
  'scroll_behavior_update',
  'ui_optimization',
  'unified_scroll_rules_implementation',
  '{
    "mobile_rules": {
      "keyboard_management": "hide_on_scroll_down",
      "sticky_elements": "only_one_at_a_time",
      "priority_order": ["search_when_active", "tabs_default"],
      "condensed_layout": "when_scrolling_or_past_threshold"
    },
    "desktop_rules": {
      "keyboard_management": "not_applicable",
      "sticky_elements": "both_search_and_tabs",
      "layout": "full_layout_maintained"
    },
    "implementation_details": {
      "hook": "useUnifiedScrollBehavior",
      "threshold": 50,
      "auto_switch_logic": "search_priority_when_active",
      "scroll_detection": "throttled_with_requestAnimationFrame"
    },
    "resolved_conflicts": [
      "removed_duplicate_scroll_listeners",
      "unified_keyboard_hiding_logic",
      "consolidated_sticky_behavior",
      "eliminated_mobile_double_sticky_overlap"
    ]
  }'::jsonb,
  NOW()
);