import React, { useEffect, useState } from 'react';
import Form from 'antd/es/form';
import { FormComponentProps } from 'antd/lib/form';
import { Badge, Modal, Table } from 'antd';
import { ConnectState } from '@/models/connect';
import { connect } from 'dva';
import apis from '@/services';
import { DeviceInstance } from '../../instance/data.d';
import styles from '@/utils/table.less';
import Search from '@/pages/device/gateway/Search';
import { ColumnProps, PaginationConfig, SorterResult } from 'antd/lib/table';
import moment from 'moment';
import encodeQueryParam from '@/utils/encodeParam';

interface Props extends FormComponentProps {
  close: Function;
  save: Function;
  data: [];
}

interface State {
  searchParam: any;
  deviceData: any;
  deviceId: any[];
}

const DeviceGatewayBind: React.FC<Props> = props => {
  const initState: State = {
    searchParam: { pageSize: 10,terms:{parentId$isnull:1} },
    deviceData: {},
    deviceId: [],
  };

  const [searchParam, setSearchParam] = useState(initState.searchParam);
  const [deviceData, setDeviceData] = useState(initState.deviceData);
  const [deviceId, setDeviceId] = useState(initState.deviceId);

  const { form } = props;

  const submitData = () => {
    form.validateFields((err, fileValue) => {
      if (err) return;
      props.save({
        ...fileValue,
        deviceId
      });
    });
  };

  const handleSearch = (params?: any) => {
    setSearchParam(params);
    apis.deviceInstance.list(
      encodeQueryParam(params),
    ).then(response => {
      setDeviceData(response.result);
    }).catch(() => {

    });
  };

  useEffect(() => {
    handleSearch(searchParam);
  }, []);

  const onTableChange = (pagination: PaginationConfig, filters: any, sorter: SorterResult<any>) => {
    apis.deviceInstance.list(
      encodeQueryParam({
        pageIndex: Number(pagination.current) - 1,
        pageSize: pagination.pageSize,
        sorts: sorter,
      }),
    ).then(response => {
      setDeviceData(response.result);
    }).catch(() => {

    });
  };

  const rowSelection = {
    onChange: (selectedRowKeys:any) => {
      setDeviceId(selectedRowKeys);
    }
  };

  const statusMap = new Map();
  statusMap.set('在线', 'success');
  statusMap.set('离线', 'error');
  statusMap.set('未激活', 'processing');

  const columns: ColumnProps<DeviceInstance>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
    },
    {
      title: '设备名称',
      dataIndex: 'name',
    },
    {
      title: '设备型号',
      dataIndex: 'productName',
    },
    {
      title: '注册时间',
      dataIndex: 'registryTime',
      width: '200px',
      render: (text: any) => moment(text).format('YYYY-MM-DD HH:mm:ss'),
      sorter: true,
    },
    {
      title: '状态',
      dataIndex: 'state',
      render: record =>
        record ? <Badge status={statusMap.get(record.text)} text={record.text}/> : '',
    },
    {
      title: '描述',
      dataIndex: 'describe',
    },
  ];

  return (
    <Modal
      title="网关绑定子设备"
      visible
      okText="确定"
      cancelText="取消"
      onOk={() => {
        submitData();
      }}
      width="60%"
      style={{ marginTop: -30 }}
      onCancel={() => props.close()}
    >
      <div className={styles.tableList}>
        <div className={styles.tableListForm}>
          <Search
            search={(params: any) => {
              setSearchParam(params);
              handleSearch({ terms: params, pageSize: 10});
            }}
          />
        </div>

        <div className={styles.StandardTable}>
          <Table
            columns={columns}
            dataSource={deviceData.data}
            rowKey="id"
            onChange={onTableChange}
            rowSelection={{
              type:'checkbox',
              ...rowSelection
            }}
            pagination={{
              current: deviceData.pageIndex + 1,
              total: deviceData.total,
              pageSize: deviceData.pageSize,
              showQuickJumper: true,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total: number) =>
                `共 ${total} 条记录 第  ${deviceData.pageIndex + 1}/${Math.ceil(
                  deviceData.total / deviceData.pageSize,
                )}页`,
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default connect(({ deviceGateway, loading }: ConnectState) => ({
  deviceGateway,
  loading,
}))(Form.create<Props>()(DeviceGatewayBind));
