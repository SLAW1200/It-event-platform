export type RuleOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'not_contains' | 'in' | 'not_in'
  | 'is_null' | 'is_not_null';

export type RuleAction =
  | 'set_field' | 'show_field' | 'hide_field'
  | 'set_status' | 'set_pricing' | 'require_field'
  | 'send_notification' | 'trigger_webhook';

export interface RuleCondition {
  field: string;         // e.g. "user.company_type"
  operator: RuleOperator;
  value?: any;
}

export interface RuleActionDef {
  action: RuleAction;
  target: string;        // field name, status value, etc.
  value?: any;
}

export interface Rule {
  id: string;
  name: string;
  priority: number;      // higher = evaluated first
  active: boolean;
  conditions: RuleCondition[];
  conditionLogic: 'AND' | 'OR';
  actions: RuleActionDef[];
}

export interface RuleEvaluationContext {
  user: Record<string, any>;
  event: Record<string, any>;
  formData: Record<string, any>;
  registration?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  actionsApplied: RuleActionDef[];
}

export interface FormEvaluationResult {
  isValid: boolean;
  errors: Record<string, string>;
  visibleFields: string[];
  hiddenFields: string[];
  requiredFields: string[];
  pricingTier: string;
  finalPrice: number;
  appliedRules: RuleEvaluationResult[];
  updatedFormData: Record<string, any>;
}
