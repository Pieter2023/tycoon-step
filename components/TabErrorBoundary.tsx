import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { I18nContext } from "../i18n";

type Props = {
  children: React.ReactNode;
  tabName: string;
};

type State = {
  hasError: boolean;
  error?: Error;
};

/**
 * Error boundary specifically for tab content.
 * Shows a compact inline error message instead of taking over the full screen.
 * Allows users to retry or switch to another tab.
 */
export default class TabErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  static contextType = I18nContext;
  declare context: React.ContextType<typeof I18nContext>;

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`TabErrorBoundary caught an error in ${this.props.tabName} tab:`, error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const t = this.context?.t ?? ((key: string) => key);
      return (
        <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6 m-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-400 mb-1">
                {t("errors.tabTitle", { tab: this.props.tabName })}
              </h3>
              <p className="text-slate-300 text-sm mb-3">
                {t("errors.tabBody")}
              </p>
              <div className="bg-black/30 border border-red-500/20 rounded-xl p-3 text-xs text-slate-400 mb-4 overflow-auto max-h-24">
                {this.state.error?.message || t("errors.unknown")}
              </div>
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition-all"
              >
                <RefreshCw size={16} />
                {t("actions.tryAgain")}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
