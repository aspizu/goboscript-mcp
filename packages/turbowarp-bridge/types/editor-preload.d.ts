/**
 * Type definitions for EditorPreload API exposed via contextBridge
 * Provides interface between Electron main process and TurboWarp editor
 */

export interface EditorPreload {
    /**
     * Check if the application should start in fullscreen mode
     * @returns boolean indicating if initially fullscreen
     */
    isInitiallyFullscreen(): boolean

    /**
     * Get the initial file to load when application starts
     * @returns Promise resolving to file data or path
     */
    getInitialFile(): Promise<string | number | null>

    /**
     * Get file data by ID
     * @param id - File identifier
     * @returns Promise resolving to file data
     */
    getFile(id: string | number): Promise<Arraybuffer>

    /**
     * Notify that a file has been opened
     * @param id - File identifier
     * @returns Promise resolving when notification is complete
     */
    openedFile(id: string | number): Promise<unknown>

    /**
     * Notify that current file has been closed
     * @returns Promise resolving when notification is complete
     */
    closedFile(): Promise<unknown>

    /**
     * Show native save file picker dialog
     * @param suggestedName - Default filename for the save dialog
     * @returns Promise resolving to selected file path or handle
     */
    showSaveFilePicker(suggestedName?: string): Promise<unknown>

    /**
     * Show native open file picker dialog
     * @returns Promise resolving to selected file path or handle
     */
    showOpenFilePicker(): Promise<unknown>

    /**
     * Set the application locale/language
     * @param locale - Locale string (e.g., 'en', 'es', 'fr')
     * @returns boolean indicating if locale was set successfully
     */
    setLocale(locale: string): boolean

    /**
     * Set the project changed state (for dirty file tracking)
     * @param changed - Whether the current project has unsaved changes
     * @returns Promise resolving when state is updated
     */
    setChanged(changed: boolean): Promise<unknown>

    /**
     * Open a new editor window
     * @returns Promise resolving when new window is created
     */
    openNewWindow(): Promise<unknown>

    /**
     * Open addon settings dialog with optional search
     * @param search - Optional search term to focus in settings
     * @returns Promise resolving when settings dialog is opened
     */
    openAddonSettings(search?: string): Promise<unknown>

    /**
     * Open project packager dialog
     * @returns Promise resolving when packager dialog is opened
     */
    openPackager(): Promise<unknown>

    /**
     * Open desktop application settings
     * @returns Promise resolving when settings dialog is opened
     */
    openDesktopSettings(): Promise<unknown>

    /**
     * Open privacy policy dialog
     * @returns Promise resolving when privacy dialog is opened
     */
    openPrivacy(): Promise<unknown>

    /**
     * Open about dialog
     * @returns Promise resolving when about dialog is opened
     */
    openAbout(): Promise<unknown>

    /**
     * Get preferred media devices (camera/microphone)
     * @returns Promise resolving to media device preferences
     */
    getPreferredMediaDevices(): Promise<unknown>

    /**
     * Get advanced customizations configuration
     * @returns Promise resolving to customizations data
     */
    getAdvancedCustomizations(): Promise<unknown>

    /**
     * Set callback for packager export functionality
     * @param callback - Function to handle packager export
     */
    setExportForPackager(callback: (data: unknown) => void): void

    /**
     * Set fullscreen state of the application
     * @param isFullScreen - Whether to enable fullscreen mode
     * @returns Promise resolving when fullscreen state is updated
     */
    setIsFullScreen(isFullScreen: boolean): Promise<unknown>
}

/**
 * Global interface for EditorPreload exposed in main world
 */
declare global {
    interface Window {
        EditorPreload: EditorPreload
    }
}
