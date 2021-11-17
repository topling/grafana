export enum TooltipDisplayMode {
  Single = 'single',
  Multi = 'multi',
  None = 'none',
  Detailed = 'detailed',
}

export type VizTooltipOptions = {
  mode: TooltipDisplayMode;
};

export interface OptionsWithTooltip {
  tooltip: VizTooltipOptions;
}
