import { OptionsWithTooltip } from './TooltipOptions2';
import { PanelOptionsEditorBuilder } from '@grafana/data';

export function addTooltipOptions<T extends OptionsWithTooltip>(
  builder: PanelOptionsEditorBuilder<T>,
  singleOnly = false
) {
  const options = singleOnly
    ? [
        { value: 'single', label: 'Single' },
        { value: 'none', label: 'Hidden' },
      ]
    : [
        { value: 'single', label: 'Single' },
        { value: 'multi', label: 'All' },
        { value: 'none', label: 'Hidden' },
        { value: 'detailed', label: 'Detailed' },
        { value: 'detailed2', label: 'Detailed2' },
        { value: 'detailed3', label: 'Detailed3' },
      ];

  builder.addRadio({
    path: 'tooltip.mode',
    name: 'Tooltip mode',
    category: ['Tooltip'],
    description: '',
    defaultValue: 'single',
    settings: {
      options,
    },
  });
}
