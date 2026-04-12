import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { ingredientCalories } from '../utils/mealUtils';
import { round } from '../utils/mathUtils';

const DeconstructionCard = ({ item, onDelete }) => {
  const kcal = ingredientCalories(item);
  const p = round(item.protein_g);
  const c = round(item.carbs_g);
  const f = round(item.fats_g);
  const portion = item.estimated_grams ? `~${item.estimated_grams}g` : '';

  return (
    <View style={styles.deconCard}>
      <View style={styles.deconLeft}>
        <Text style={styles.deconName}>{item.name}</Text>
        {portion ? <Text style={styles.deconPortion}>{portion}</Text> : null}
      </View>
      <View style={styles.deconRight}>
        <Text style={styles.deconKcal}>{kcal} kcal</Text>
        <Text style={styles.deconMacros}>
          {p}g P • {c}g C • {f}g F
        </Text>
      </View>
      {onDelete && (
        <TouchableOpacity 
          onPress={onDelete} 
          style={styles.deleteButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Trash2 color="#FF4D4D" size={16} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  deconCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },
  deconLeft: {
    flex: 1,
    paddingRight: 12,
  },
  deconName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  deconPortion: {
    fontSize: 12,
    color: '#555577',
  },
  deconRight: {
    alignItems: 'flex-end',
  },
  deconKcal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  deconMacros: {
    fontSize: 12,
    color: '#555577',
  },
  deleteButton: {
    paddingLeft: 12,
    justifyContent: 'center',
  },
});

export default DeconstructionCard;
