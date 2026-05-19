import { Injectable, Logger } from '@nestjs/common';
import {
  Rule, RuleCondition, RuleOperator, RuleEvaluationContext,
  RuleEvaluationResult, FormEvaluationResult,
} from './rules.interface';

@Injectable()
export class RulesEngineService {
  private readonly logger = new Logger(RulesEngineService.name);

  /**
   * Evaluate a list of rules against a context and return results.
   * Rules are sorted by priority (highest first).
   */
  evaluateRules(
    rules: Rule[],
    context: RuleEvaluationContext,
  ): RuleEvaluationResult[] {
    const sorted = [...rules].sort((a, b) => b.priority - a.priority);
    return sorted
      .filter((r) => r.active)
      .map((rule) => this.evaluateRule(rule, context));
  }

  /**
   * Full form evaluation: validates, resolves field visibility,
   * calculates pricing, and returns a complete result.
   */
  evaluateForm(
    rules: Rule[],
    context: RuleEvaluationContext,
    basePrice: number,
  ): FormEvaluationResult {
    const results = this.evaluateRules(rules, context);
    const matched = results.filter((r) => r.matched);

    const visibleFields = new Set<string>();
    const hiddenFields = new Set<string>();
    const requiredFields = new Set<string>();
    const errors: Record<string, string> = {};
    let pricingTier = 'standard';
    let finalPrice = basePrice;
    const updatedFormData = { ...context.formData };

    for (const result of matched) {
      for (const action of result.actionsApplied) {
        switch (action.action) {
          case 'show_field':
            visibleFields.add(action.target);
            hiddenFields.delete(action.target);
            break;
          case 'hide_field':
            hiddenFields.add(action.target);
            visibleFields.delete(action.target);
            break;
          case 'require_field':
            requiredFields.add(action.target);
            break;
          case 'set_pricing':
            pricingTier = action.target;
            finalPrice = action.value ?? basePrice;
            break;
          case 'set_field':
            updatedFormData[action.target] = action.value;
            break;
          case 'set_status':
            updatedFormData['_status'] = action.value;
            break;
        }
      }
    }

    // Validate required fields
    for (const field of requiredFields) {
      if (!updatedFormData[field]) {
        errors[field] = `${field} is required`;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      visibleFields: [...visibleFields],
      hiddenFields: [...hiddenFields],
      requiredFields: [...requiredFields],
      pricingTier,
      finalPrice,
      appliedRules: matched,
      updatedFormData,
    };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────

  private evaluateRule(rule: Rule, ctx: RuleEvaluationContext): RuleEvaluationResult {
    const conditionResults = rule.conditions.map((c) => this.evaluateCondition(c, ctx));
    const matched =
      rule.conditionLogic === 'AND'
        ? conditionResults.every(Boolean)
        : conditionResults.some(Boolean);

    if (matched) {
      this.logger.debug(`Rule "${rule.name}" matched`);
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      matched,
      actionsApplied: matched ? rule.actions : [],
    };
  }

  private evaluateCondition(condition: RuleCondition, ctx: RuleEvaluationContext): boolean {
    const fieldValue = this.resolveField(condition.field, ctx);
    const { operator, value } = condition;

    switch (operator as RuleOperator) {
      case 'eq':           return fieldValue == value;
      case 'neq':          return fieldValue != value;
      case 'gt':           return Number(fieldValue) > Number(value);
      case 'gte':          return Number(fieldValue) >= Number(value);
      case 'lt':           return Number(fieldValue) < Number(value);
      case 'lte':          return Number(fieldValue) <= Number(value);
      case 'contains':     return String(fieldValue).includes(String(value));
      case 'not_contains': return !String(fieldValue).includes(String(value));
      case 'in':           return Array.isArray(value) && value.includes(fieldValue);
      case 'not_in':       return Array.isArray(value) && !value.includes(fieldValue);
      case 'is_null':      return fieldValue == null || fieldValue === '';
      case 'is_not_null':  return fieldValue != null && fieldValue !== '';
      default:             return false;
    }
  }

  /**
   * Resolve a dot-notation field path against the context.
   * e.g. "user.company_type" → ctx.user.company_type
   */
  private resolveField(field: string, ctx: RuleEvaluationContext): any {
    const parts = field.split('.');
    let current: any = ctx;
    for (const part of parts) {
      if (current == null) return null;
      current = current[part];
    }
    return current;
  }
}
