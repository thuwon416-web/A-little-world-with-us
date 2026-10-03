import React from 'react'
import { StyleSheet, Text, View, type ViewProps } from 'react-native'
import { useTheme } from '@/context/ThemeContext'
interface BadgeProps extends ViewProps { label:string; tone?:'primary'|'secondary'|'success'|'warning'|'danger' }
export function Badge({label,tone='primary',style,...props}:BadgeProps){const {colors}=useTheme();const toneColor=tone==='primary'?colors.accent1:tone==='secondary'?colors.accent2:tone==='success'?colors.success:tone==='warning'?colors.warning:colors.error;return <View {...props} style={[styles.badge,{backgroundColor:toneColor+'18',borderColor:toneColor+'35'},style]}><Text style={[styles.text,{color:toneColor}]}>{label}</Text></View>}
const styles=StyleSheet.create({badge:{alignSelf:'flex-start',borderRadius:999,borderWidth:1,paddingHorizontal:10,paddingVertical:5},text:{fontSize:11,fontWeight:'700',lineHeight:15}})
