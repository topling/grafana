import React, { FC } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Field, SliderValueEditor } from '@grafana/ui';

import {
  ColorDimensionEditor,
  ResourceDimensionEditor,
  ScaleDimensionEditor,
  TextDimensionEditor,
} from 'app/features/dimensions/editors';
import {
  ScaleDimensionConfig,
  ResourceDimensionConfig,
  ColorDimensionConfig,
  ResourceFolderName,
  TextDimensionConfig,
  defaultTextConfig,
} from 'app/features/dimensions/types';
import { defaultStyleConfig, StyleConfig } from '../../style/types';

export const StyleEditor: FC<StandardEditorProps<StyleConfig, any, any>> = ({ value, context, onChange }) => {
  const onSizeChange = (sizeValue: ScaleDimensionConfig | undefined) => {
    onChange({ ...value, size: sizeValue });
  };

  const onSymbolChange = (symbolValue: ResourceDimensionConfig | undefined) => {
    onChange({ ...value, symbol: symbolValue });
  };

  const onTextChange = (textValue: TextDimensionConfig | undefined) => {
    onChange({ ...value, text: textValue });
  };

  const onColorChange = (colorValue: ColorDimensionConfig | undefined) => {
    onChange({ ...value, color: colorValue });
  };

  const onOpacityChange = (opacityValue: number | undefined) => {
    onChange({ ...value, opacity: opacityValue });
  };

  return (
    <>
      <Field label={'Size'}>
        <ScaleDimensionEditor
          value={value.size ?? defaultStyleConfig.size}
          context={context}
          onChange={onSizeChange}
          item={
            {
              settings: {
                min: 1,
                max: 100,
              },
            } as any
          }
        />
      </Field>
      <Field label={'Symbol'}>
        <ResourceDimensionEditor
          value={value.symbol ?? defaultStyleConfig.symbol}
          context={context}
          onChange={onSymbolChange}
          item={
            {
              settings: {
                resourceType: 'icon',
                showSourceRadio: false,
                folderName: ResourceFolderName.Marker,
              },
            } as any
          }
        />
      </Field>
      <Field label={'Text label'}>
        <TextDimensionEditor
          value={value.text ?? defaultTextConfig}
          context={context}
          onChange={onTextChange}
          item={{} as any}
        />
      </Field>
      <Field label={'Color'}>
        <ColorDimensionEditor
          value={value.color ?? defaultStyleConfig.color}
          context={context}
          onChange={onColorChange}
          item={{} as any}
        />
      </Field>
      <Field label={'Fill opacity'}>
        <SliderValueEditor
          value={value.opacity ?? defaultStyleConfig.opacity}
          context={context}
          onChange={onOpacityChange}
          item={
            {
              settings: {
                min: 0,
                max: 1,
                step: 0.1,
              },
            } as any
          }
        />
      </Field>
    </>
  );
};
