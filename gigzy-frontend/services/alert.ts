import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert that works on BOTH web and native.
 * Alert.alert() is a no-op on web — this uses window.alert/confirm instead.
 */
export function showAlert(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

/**
 * Cross-platform confirm dialog.
 * On web, uses window.confirm(). On native, uses Alert.alert() with buttons.
 */
export function showConfirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmText: string = 'OK',
  cancelText: string = 'Cancel'
) {
  if (Platform.OS === 'web') {
    const result = window.confirm(`${title}\n\n${message}`);
    if (result) {
      onConfirm();
    }
  } else {
    Alert.alert(title, message, [
      { text: cancelText, style: 'cancel' },
      { text: confirmText, onPress: onConfirm },
    ]);
  }
}
