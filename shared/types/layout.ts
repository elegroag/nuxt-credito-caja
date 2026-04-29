import type { Component } from 'vue'

export interface NavItem {
    label: string
    to: string
    abbr: string
    icon: Component
    adminOnly?: boolean
    requiredPermissions?: string[]
    excludedRoles?: string[]
    category?: 'user' | 'admin'
}

export interface HealthStatus {
    isConnected: boolean;
    connectionError: string;
    checkingConnection: boolean;
    connectionMessage: string;
    connectionStatusClass: string;
}
