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
        <div className="surface m-4 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#ff453a]/15">
              <AlertTriangle className="text-red-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-1">
                {t("errors.tabTitle", { tab: this.props.tabName })}
              </h3>
              <p className="text-slate-300 text-sm mb-3">
                {t("errors.tabBody")}
              </p>
              <div className="surface-inset p-3 text-xs text-slate-400 mb-4 overflow-auto max-h-24 font-mono">
                {this.state.error?.message || t("errors.unknown")}
              </div>
              <button
                onClick={this.handleRetry}
                className="btn-secondary h-9 px-4 text-sm"
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
