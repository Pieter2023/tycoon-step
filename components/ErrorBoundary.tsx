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
        <div className="min-h-screen text-white flex items-center justify-center p-6">
          <div className="surface max-w-lg w-full p-6">
            <h1 className="text-xl font-bold mb-2">{t("errors.genericTitle")}</h1>
            <p className="text-slate-300 text-sm mb-4">
              {t("errors.genericBody")}
            </p>
            <div className="surface-inset p-3 text-xs text-slate-300 overflow-auto">
              {this.state.error?.message || t("errors.unknown")}
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="btn-primary h-10 px-5 text-sm"
                onClick={this.handleReset}
              >
                {t("actions.refresh")}
              </button>
              <button
                className="btn-secondary h-10 px-5 text-sm"
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
