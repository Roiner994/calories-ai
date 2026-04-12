import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const LoginScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.error_title'), t('auth.empty_fields'));
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert(t('auth.login_failed'), error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>{t('auth.login_title')}</Text>
            <Text style={styles.subtitle}>
              {t('auth.login_subtitle')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Mail color="#A0A0B0" size={20} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.email_placeholder')}
                placeholderTextColor="#777790"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock color="#A0A0B0" size={20} />
              <TextInput
                style={styles.input}
                placeholder={t('auth.password_placeholder')}
                placeholderTextColor="#777790"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.sign_in_btn')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.no_account')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.linkText}>{t('auth.sign_up_btn')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0B0',
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 18,
    flexDirection: 'row',
    items: 'center', // Fix: should be alignItems: 'center'
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    marginLeft: 12,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: '#4A9EFF',
    borderRadius: 18,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    shadowColor: '#4A9EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#A0A0B0',
    fontSize: 15,
  },
  linkText: {
    color: '#4A9EFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default LoginScreen;
