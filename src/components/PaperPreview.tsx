import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Fonts, brand } from '@/constants/theme';
import { columnsFor, type Line, type PaperWidth } from '@/printing/ticketBuilder';

const NORMAL = 12; // font size for normal text
const DOUBLE = 24; // double-size text prints twice as wide, so it fits half as many characters
const CHAR_W = 0.6; // monospace glyph width as a fraction of font size

/**
 * Draws printer lines on a "paper strip" sized to the selected paper width, so the
 * owner can see roughly what a ticket will look like before any printer is connected.
 */
export function PaperPreview({ lines, width }: { lines: Line[]; width: PaperWidth }) {
  const paperWidth = Math.ceil(columnsFor(width) * NORMAL * CHAR_W) + 24;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={[styles.paper, { width: paperWidth }]}>
        {lines.map((l, i) => (
          <Text
            key={i}
            allowFontScaling={false}
            style={[
              styles.line,
              {
                fontSize: l.size === 'double' ? DOUBLE : NORMAL,
                lineHeight: l.size === 'double' ? DOUBLE + 4 : NORMAL + 4,
                fontWeight: l.bold ? '700' : '400',
                textAlign: l.align ?? 'left',
              },
            ]}>
            {l.text === '' ? ' ' : l.text}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  paper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
    alignSelf: 'center',
  },
  line: { fontFamily: Fonts.mono, color: '#111111' },
});
