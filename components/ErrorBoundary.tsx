import React from "react";
import { I18nContext } from "../i18n";

type Props = {
  children: React.ReactNode;
  onReset?: () => void;
};

type State = {
  hasError: boolean;
  error?: Error;
};

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  static contextType = I18nContext;
  declare context: React.ContextType<typeof I18nContext>;

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info);
  }

  private handleReset = () => {
    if (this.props.onReset) return this.props.onReset();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const t = this.context?.t ?? ((key: string) => key);
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
            <h1 className="text-xl font-bold mb-2">{t("errors.genericTitle")}</h1>
            <p className="text-slate-300 text-sm mb-4">
              {t("errors.genericBody")}
            </p>
            <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 overflow-auto">
              {this.state.error?.message || t("errors.unknown")}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold"
                onClick={this.handleReset}
              >
                {t("actions.refresh")}
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 font-semibold"
                onClick={() => this.setState({ hasError: false, error: undefined })}
              >
                {t("actions.tryContinue")}
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
