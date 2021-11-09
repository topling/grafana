package grpcplugin

import (
	"context"
	"errors"
	"sync"

	"google.golang.org/grpc/credentials"

	"google.golang.org/grpc"
	"google.golang.org/grpc/connectivity"

	"github.com/grafana/grafana-plugin-sdk-go/backend"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/process"
	"github.com/grafana/grafana/pkg/plugins/backendplugin"
)

type remotePlugin struct {
	descriptor     remotePluginDescriptor
	clientFactory  func() *remotePluginConn
	client         *remotePluginConn
	pluginClient   pluginClient
	logger         log.Logger
	mutex          sync.RWMutex
	decommissioned bool
}

type remotePluginConn struct {
	conn *grpc.ClientConn
	err  error
}

// newPlugin allocates and returns a new gRPC (external) backendplugin.Plugin.
func newRemotePlugin(descriptor remotePluginDescriptor) backendplugin.PluginFactoryFunc {
	return func(pluginID string, logger log.Logger, env []string) (backendplugin.Plugin, error) {
		return &remotePlugin{
			descriptor: descriptor,
			logger:     logger,
			clientFactory: func() *remotePluginConn {
				opts := make([]grpc.DialOption, 0)
				if descriptor.connOpts.TLSConfig == nil {
					opts = append(opts, grpc.WithInsecure())
				} else {
					opts = append(opts, grpc.WithTransportCredentials(
						credentials.NewTLS(descriptor.connOpts.TLSConfig)))
				}

				conn, err := grpc.Dial(descriptor.connOpts.Address, opts...)
				return &remotePluginConn{
					conn: conn,
					err:  err,
				}
			},
		}, nil
	}
}

func (rp *remotePlugin) PluginID() string {
	return rp.descriptor.pluginID
}

func (rp *remotePlugin) Logger() log.Logger {
	return rp.logger
}

func (rp *remotePlugin) Start(ctx context.Context) error {
	rp.mutex.Lock()
	defer rp.mutex.Unlock()

	rp.client = rp.clientFactory()

	if rp.client.err != nil {
		return errors.New("unable to establish connection with remote plugin")
	}

	var err error
	rp.pluginClient, err = newRemoteClientV2(rp.client.conn)
	if err != nil {
		return err
	}

	elevated, err := process.IsRunningWithElevatedPrivileges()
	if err != nil {
		rp.logger.Debug("Error checking plugin process execution privilege", "err", err)
	}
	if elevated {
		rp.logger.Warn("Plugin process is running with elevated privileges. This is not recommended")
	}

	return nil
}

func (rp *remotePlugin) Stop(ctx context.Context) error {
	rp.mutex.Lock()
	defer rp.mutex.Unlock()

	if rp.client != nil {
		return rp.client.conn.Close()
	}
	return nil
}

func (rp *remotePlugin) IsManaged() bool {
	return true
}

func (rp *remotePlugin) Exited() bool {
	rp.mutex.RLock()
	defer rp.mutex.RUnlock()
	if rp.client != nil {
		return rp.client.conn.GetState() == connectivity.Shutdown
	}
	return true
}

func (rp *remotePlugin) Decommission() error {
	rp.mutex.RLock()
	defer rp.mutex.RUnlock()

	rp.decommissioned = true

	return nil
}

func (rp *remotePlugin) IsDecommissioned() bool {
	return rp.decommissioned
}

func (rp *remotePlugin) remotePluginClient() (pluginClient, bool) {
	rp.mutex.RLock()
	if rp.client == nil || rp.client.conn.GetState() == connectivity.Shutdown || rp.pluginClient == nil {
		rp.mutex.RUnlock()
		return nil, false
	}
	pluginClient := rp.pluginClient
	rp.mutex.RUnlock()
	return pluginClient, true
}

func (rp *remotePlugin) CollectMetrics(ctx context.Context) (*backend.CollectMetricsResult, error) {
	pluginClient, ok := rp.remotePluginClient()
	if !ok {
		return nil, backendplugin.ErrPluginUnavailable
	}
	return pluginClient.CollectMetrics(ctx)
}

func (rp *remotePlugin) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	pluginClient, ok := rp.remotePluginClient()
	if !ok {
		return nil, backendplugin.ErrPluginUnavailable
	}
	return pluginClient.CheckHealth(ctx, req)
}

func (rp *remotePlugin) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	pluginClient, ok := rp.remotePluginClient()
	if !ok {
		return nil, backendplugin.ErrPluginUnavailable
	}

	return pluginClient.QueryData(ctx, req)
}

func (rp *remotePlugin) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	pluginClient, ok := rp.remotePluginClient()
	if !ok {
		return backendplugin.ErrPluginUnavailable
	}
	return pluginClient.CallResource(ctx, req, sender)
}

func (rp *remotePlugin) SubscribeStream(ctx context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	pluginClient, ok := rp.remotePluginClient()
	if !ok {
		return nil, backendplugin.ErrPluginUnavailable
	}
	return pluginClient.SubscribeStream(ctx, req)
}

func (rp *remotePlugin) PublishStream(ctx context.Context, req *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	pluginClient, ok := rp.remotePluginClient()
	if !ok {
		return nil, backendplugin.ErrPluginUnavailable
	}
	return pluginClient.PublishStream(ctx, req)
}

func (rp *remotePlugin) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
	pluginClient, ok := rp.remotePluginClient()
	if !ok {
		return backendplugin.ErrPluginUnavailable
	}
	return pluginClient.RunStream(ctx, req, sender)
}
