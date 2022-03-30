import "../../../../components/ha-form/ha-form";
import { html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import {
  array,
  assert,
  boolean,
  number,
  object,
  optional,
  string,
  union,
  assign,
} from "superstruct";
import { fireEvent } from "../../../../common/dom/fire_event";
import type { HomeAssistant } from "../../../../types";
import { ConfigEntity, GlanceCardConfig } from "../../cards/types";
import "../../components/hui-entity-editor";
import type { LovelaceCardEditor } from "../../types";
import { processEditorEntities } from "../process-editor-entities";
import { entitiesConfigStruct } from "../structs/entities-struct";
import { baseLovelaceCardConfig } from "../structs/base-card-struct";
import type { HaFormSchema } from "../../../../components/ha-form/types";

const cardConfigStruct = assign(
  baseLovelaceCardConfig,
  object({
    title: optional(union([string(), number()])),
    theme: optional(string()),
    columns: optional(number()),
    show_name: optional(boolean()),
    show_state: optional(boolean()),
    show_icon: optional(boolean()),
    state_color: optional(boolean()),
    entities: array(entitiesConfigStruct),
  })
);

const SCHEMA: HaFormSchema[] = [
  { name: "title", selector: { text: {} } },
  {
    name: "",
    type: "grid",
    schema: [
      { name: "columns", selector: { number: { min: 1, mode: "box" } } },
      { name: "theme", selector: { theme: {} } },
    ],
  },
  {
    name: "",
    type: "grid",
    column_min_width: "100px",
    schema: [
      { name: "show_name", selector: { boolean: {} } },
      { name: "show_icon", selector: { boolean: {} } },
      { name: "show_state", selector: { boolean: {} } },
    ],
  },
  { name: "state_color", selector: { boolean: {} } },
];

@customElement("hui-glance-card-editor")
export class HuiGlanceCardEditor
  extends LitElement
  implements LovelaceCardEditor
{
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: GlanceCardConfig;

  @state() private _configEntities?: ConfigEntity[];

  public setConfig(config: GlanceCardConfig): void {
    assert(config, cardConfigStruct);
    this._config = config;
    this._configEntities = processEditorEntities(config.entities);
  }

  protected render(): TemplateResult {
    if (!this.hass || !this._config) {
      return html``;
    }

    const data = {
      show_name: true,
      show_icon: true,
      show_state: true,
      ...this._config,
    };

    return html`
      <ha-form
        .hass=${this.hass}
        .data=${data}
        .schema=${SCHEMA}
        .computeLabel=${this._computeLabelCallback}
        @value-changed=${this._valueChanged}
      ></ha-form>
      <hui-entity-editor
        .hass=${this.hass}
        .entities=${this._configEntities}
        @entities-changed=${this._entitiesChanged}
      ></hui-entity-editor>
    `;
  }

  private _valueChanged(ev: CustomEvent): void {
    const config = ev.detail.value;
    fireEvent(this, "config-changed", { config });
  }

  private _entitiesChanged(ev: CustomEvent): void {
    let config = this._config!;
    config = { ...config, entities: ev.detail.entities! };

    this._configEntities = processEditorEntities(this._config!.entities);
    fireEvent(this, "config-changed", { config });
  }

  private _computeLabelCallback = (schema: HaFormSchema) => {
    if (schema.name === "theme") {
      return `${this.hass!.localize(
        "ui.panel.lovelace.editor.card.generic.theme"
      )} (${this.hass!.localize(
        "ui.panel.lovelace.editor.card.config.optional"
      )})`;
    }
    return (
      this.hass!.localize(
        `ui.panel.lovelace.editor.card.glance.${schema.name}`
      ) ||
      this.hass!.localize(
        `ui.panel.lovelace.editor.card.generic.${schema.name}`
      )
    );
  };
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-glance-card-editor": HuiGlanceCardEditor;
  }
}
