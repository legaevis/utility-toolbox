import type { ToolDefinition } from '../../types/tool';
import { UnitConverter } from './UnitConverter';

export const unitConverterTool: ToolDefinition = {
  id: 'unit-converter',
  category: 'converters',
  keywords: [
    'unit', 'convert', 'converter', 'inch', 'foot', 'feet', 'mile', 'pound', 'ounce', 'gallon',
    'celsius', 'fahrenheit', 'kelvin', 'km', 'kg', 'mph', 'knot', 'acre',
    'единицы', 'конвертер', 'дюйм', 'фут', 'миля', 'фунт', 'унция', 'галлон', 'градус', 'температура', 'вес', 'длина', 'скорость', 'площадь', 'объём',
  ],
  component: UnitConverter,
};
