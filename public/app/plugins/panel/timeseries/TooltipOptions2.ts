export enum TooltipDisplayMode {
  Single = 'single',
  Multi = 'multi',
  None = 'none',
  Detailed = 'detailed',
  Detailed2 = 'detailed2',
}

export type VizTooltipOptions = {
  mode: TooltipDisplayMode;
};

export interface OptionsWithTooltip {
  tooltip: VizTooltipOptions;
}
