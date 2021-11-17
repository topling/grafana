import { OptionsWithLegend } from '@grafana/schema';
import { OptionsWithTooltip } from './TooltipOptions2';

export interface TimeSeriesOptions extends OptionsWithLegend, OptionsWithTooltip {}
