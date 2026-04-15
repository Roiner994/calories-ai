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
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';

const SignupScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { signUp } = useAuth();

  const emailRef = React.useRef(null);
  const passwordRef = React.useRef(null);

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert(t('auth.error_title'), t('auth.empty_fields'));
      return;
    }

    setLoading(true);
    const { data, error } = await signUp(email, password);
    setLoading(false);

    if (error) {
      Alert.alert(t('auth.signup_failed'), error.message);
    } else {
      Alert.alert(t('common.success'), t('auth.signup_success'), [
        { text: t('common.ok'), onPress: () => navigation.navigate('Login') },
      ]);
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
            <Text style={styles.title}>{t('auth.signup_title')}</Text>
            <Text style={styles.subtitle}>{t('auth.signup_subtitle')}</Text>
          </View>

          <View style={styles.form}>
            {/* Email */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => emailRef.current?.focus()}
              style={[
                styles.inputContainer,
                focusedField === 'email' && styles.inputContainerFocused,
              ]}
            >
              <Mail color={focusedField === 'email' ? '#4A9EFF' : '#A0A0B0'} size={20} />
              <TextInput
                ref={emailRef}
                style={styles.input}
                placeholder={t('auth.email_placeholder')}
                placeholderTextColor="#777790"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </TouchableOpacity>

            {/* Password */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => passwordRef.current?.focus()}
              style={[
                styles.inputContainer,
                focusedField === 'password' && styles.inputContainerFocused,
              ]}
            >
              <Lock color={focusedField === 'password' ? '#4A9EFF' : '#A0A0B0'} size={20} />
              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder={t('auth.password_placeholder')}
                placeholderTextColor="#777790"
                secureTextEntry={!showPassword}
                textContentType="newPassword"
                autoComplete="new-password"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(prev => !prev)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityRole="button"
              >
                {showPassword ? (
                  <EyeOff color="#A0A0B0" size={20} />
                ) : (
                  <Eye color="#A0A0B0" size={20} />
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.signupButton, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>{t('auth.sign_up_btn')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('auth.have_account')}</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.linkText}>{t('auth.sign_in_btn')}</Text>
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
    lineHeight: 24,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    borderWidth: 1,
    borderColor: '#2D2D44',
  },
  inputContainerFocused: {
    borderColor: '#4A9EFF',
    shadowColor: '#4A9EFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    marginLeft: 12,
    fontSize: 16,
  },
  signupButton: {
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
    gap: 6,
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

export default SignupScreen;
