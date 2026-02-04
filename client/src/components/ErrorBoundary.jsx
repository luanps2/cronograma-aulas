import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#F5F7FA',
                    fontFamily: 'sans-serif',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <h2 style={{ color: '#D32F2F', marginBottom: '10px' }}>Ocorreu um erro inesperado</h2>
                    <p style={{ color: '#666', marginBottom: '20px', maxWidth: '400px' }}>
                        Não foi possível carregar o conteúdo. Tentamos capturar o erro para evitar que a tela fique branca.
                    </p>
                    <button
                        onClick={this.handleReload}
                        style={{
                            padding: '12px 24px',
                            backgroundColor: '#0277BD',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            boxShadow: '0 2px 8px rgba(2, 119, 189, 0.3)'
                        }}
                    >
                        Recarregar Aplicação
                    </button>
                    {process.env.NODE_ENV === 'development' && (
                        <pre style={{
                            marginTop: '40px',
                            padding: '20px',
                            backgroundColor: '#fff',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            textAlign: 'left',
                            maxWidth: '800px',
                            overflow: 'auto',
                            width: '100%',
                            fontSize: '0.85rem'
                        }}>
                            {this.state.error && this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
