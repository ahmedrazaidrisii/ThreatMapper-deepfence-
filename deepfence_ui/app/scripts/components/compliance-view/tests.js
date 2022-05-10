/* eslint-disable dot-notation */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable */
import React from 'react';
import { connect } from 'react-redux';
import { DfTableV2 } from '../common/df-table-v2';
import DFTable from '../common/df-table/index';
import {
  getComplianceTestAction,
  genericMaskDocsAction,
  complianceTestRemoveAction,
  requestManualAlertNotification,
  unmaskDocsAction,
  deleteDocsByIdAction,
  getScanResultsAction
  // breadcrumbChange
} from '../../actions/app-actions';
import { dateTimeFormat } from '../../utils/time-utils';
import withMultiSelectColumn from '../common/df-table/with-multi-select-column';
import pollable from '../common/header-view/pollable';
import { ComplianceTestModal } from './test-modal';

class ComplianceTests extends React.PureComponent {
  constructor(props) {
    super(props);
    this.getComplianceTest = this.getComplianceTest.bind(this);
    this.handleDescClick = this.handleDescClick.bind(this);
    this.tableChangeHandler = this.tableChangeHandler.bind(this);
    this.handlePageChange = this.handlePageChange.bind(this);
    this.unmaskDocs = this.unmaskDocs.bind(this);
    this.maskDocs = this.maskDocs.bind(this);
    this.removeDocs = this.removeDocs.bind(this);
    this.alertDocs = this.alertDocs.bind(this);
    this.deleteDocs = this.deleteDocs.bind(this);
    this.state = {
      testData: null,
      isTestModalOpen: false
    };
  }

  componentDidMount() {
    // pollable: register the function which needs to be polled
    // we don't have to explicitly start the polling here, as the DFTable
    // calls the updatePollParams which starts the polling.
    const { registerPolling, registerActions, updatePollParams } = this.props;
    const {
      nodeId,
      checkType,
    } = this.props;
    let changedNodeId;
    if (nodeId && nodeId.length > 12) {
      changedNodeId = `${nodeId.substring(0, 11)}...`;
    }
    registerPolling(this.getComplianceTest);
    const changedCheckType = {
      standard: 'Standard',
      cis: 'CIS',
      nist_master: 'NIST Master',
      nist_slave: 'NIST Slave',
      pcidss: 'PCI-DSS',
      hipaa: 'Hipaa',
      mission_critical_classified: 'NIST Mission Critical'
    };
    const actionList = [
      {
        name: 'Notify',
        icon: (<i className="fa fa-bell-o active-color cursor" />),
        onClick: this.alertDocs,
      },
      {
        name: 'Mask',
        userRole: 'admin',
        icon: (<i className="fa fa-eye-slash red cursor" />),
        onClick: this.maskDocs,
        postClickSuccess: updatePollParams,
        showConfirmationDialog: true,
        confirmationDialogParams: {
          dialogTitle: 'Mask these records?',
          dialogBody: 'Are you sure you want to mask the selected records?',
          confirmButtonText: 'Yes, Mask',
          cancelButtonText: 'No, Keep',
          contentStyles: {
            height: '230px',
          },
          additionalInputs: [
            {
              type: 'text',
              name: 'comments',
              label: 'Add Comments',
              placeholder: 'Optional',
            },
          ],
        },
      },
      {
        name: 'Unmask',
        userRole: 'admin',
        icon: (<i className="fa fa-eye cursor" />),
        onClick: this.unmaskDocs,
        postClickSuccess: updatePollParams,
        showConfirmationDialog: true,
        confirmationDialogParams: {
          dialogTitle: 'Unmask these records?',
          dialogBody: 'Are you sure you want to unmask the selected records?',
          confirmButtonText: 'Yes, Unmask',
          cancelButtonText: 'No, Keep',
        },
      },
      {
        name: 'Delete',
        userRole: 'admin',
        icon: (<i className="fa fa-trash-o red cursor" />),
        onClick: this.deleteDocs,
        postClickSuccess: this.removeDocs,
        showConfirmationDialog: true,
        confirmationDialogParams: {
          dialogTitle: 'Delete these records?',
          dialogBody: 'Are you sure you want to Delete the selected records?',
          confirmButtonText: 'Yes, Delete',
          cancelButtonText: 'No, Keep',
        },
      },
    ];
    registerActions(actionList);
    // this.props.dispatch(breadcrumbChange([{ name: 'Compliance', link: '/compliance' }, { name: changedCheckType[checkType], link: `/compliance/${checkType}` }, { name: changedNodeId }]));
  }

  componentWillUnmount() {
    // pollable: stop polling on unmount
    const { stopPolling } = this.props;
    stopPolling();
  }

  UNSAFE_componentWillReceiveProps(newProps) {
    if (this.props.hideMasked !== newProps.hideMasked) {
      this.getComplianceTest({
        hideMasked: newProps.hideMasked,
      });
    }
  }

  maskDocs(selectedDocIndex = {}, allRows, additionalInputValuesIm = Map()) {
    const additionalInputValues = additionalInputValuesIm.toJS();
    const params = {
      /* eslint-disable no-underscore-dangle */
      docs: Object.keys(selectedDocIndex).map(key => ({
        _id: selectedDocIndex[key]._id,
        _type: selectedDocIndex[key]._type,
        _index: selectedDocIndex[key]._index,
      })),
      /* eslint-enable */
      ...additionalInputValues
    };
    const { dispatch } = this.props;
    return dispatch(genericMaskDocsAction(params));
  }

  removeDocs(selectedDocIndex = {}) {
    const forRemoval = Object.keys(selectedDocIndex).reduce((acc, key) => {
      acc = {
        ...acc,
        checkType: selectedDocIndex[key].compliance_check_type,
        nodeId: selectedDocIndex[key].node_id,
        idList: [
          ...acc.idList,
          /* eslint-disable no-underscore-dangle */
          selectedDocIndex[key]._id,
          /* eslint-enable */
        ],
      };
      return acc;
    }, { idList: [] });
    const { dispatch } = this.props;

    return dispatch(
      complianceTestRemoveAction(forRemoval.nodeId, forRemoval.checkType, forRemoval.idList)
    );
  }

  alertDocs(selectedDocIndex = {}) {
    /* eslint-disable no-underscore-dangle */
    const params = Object.keys(selectedDocIndex).map(key => ({
      _id: selectedDocIndex[key]._id,
      _type: selectedDocIndex[key]._type,
      _index: selectedDocIndex[key]._index,
    }));
    /* eslint-enable */
    const { dispatch } = this.props;
    return dispatch(requestManualAlertNotification(params));
  }

  unmaskDocs(selectedDocIndex = {}) {
    /* eslint-disable no-underscore-dangle */
    const params = {
      docs: Object.keys(selectedDocIndex).map(key => ({
        _id: selectedDocIndex[key]._id,
        _type: selectedDocIndex[key]._type,
        _index: selectedDocIndex[key]._index,
      }))
    };
    /* eslint-enable */

    const { dispatch } = this.props;
    return dispatch(unmaskDocsAction(params));
  }

  deleteDocs(selectedDocIndex = {}) {
    /* eslint-disable no-underscore-dangle */
    const paramList = Object.keys(selectedDocIndex).map(key => ({
      _id: selectedDocIndex[key]._id,
      _type: selectedDocIndex[key]._type,
      _index: selectedDocIndex[key]._index,
    }));
    const params = paramList.reduce((acc, param) => {
      acc.index_name = param._index;
      acc.doc_type = param._type;
      acc.ids = [
        ...acc.ids,
        param._id,
      ];
      return acc;
    }, { ids: [] });
    /* eslint-enable */
    const { dispatch } = this.props;
    return dispatch(deleteDocsByIdAction(params));
  }

  tableChangeHandler(params = {}) {
    // pollable: on any change in the DF Table params, update the polling params,
    // which will update and restart polling with new params.
    const { updatePollParams } = this.props;
    updatePollParams(params);
  }

  handlePageChange(pageNumber) {
    this.tableChangeHandler({
      page: pageNumber
    })
  }

  getComplianceTest(params = {}) {
    const {
      dispatch,
      nodeId,
      scanId,
      checkType,
    } = this.props;
    const pageSize = 20;
    const page = 0;
    const {
      size = pageSize,
      sorted = [],
      globalSearchQuery = [],
    } = params;
    const cloudType = 'aws';
    const sortArr = sorted.map(el => (
      {
        sort_by: el.id,
        sort_order: el.desc ? 'desc' : 'asc',
      }
    ));
    // TODO: Server support for sort by multiple fields
    return dispatch(getScanResultsAction({nodeId, scanId, checkType, cloudType, ...params}));
  }

  handleDescClick(docId) {
    const { test } = this.props;
    const testResult =[];
    test.hits?.forEach(t => {
      if(t._id === docId) {
        testResult.push(t._source);
    }});

    this.setState({
      testData: testResult[0],
      isTestModalOpen: true
    });
  }



  render() {
    const { test = [], total, checkType, multiSelectColumn
    } = this.props;

    const tests = [];
    test.hits?.forEach(t => {
      tests.push(t._source);
    })
    // const noDataText = `${checkType.toUpperCase()} compliance check could not be found`;
    const noDataText = `Compliance check could not be found`;
    return (
      <div className="compliance-check-view">
        <DFTable
          noDataText={noDataText}
          showPagination
          defaultPageSize={20}
          pages={test.total}
          data={tests}
          multiSort={false}
          minRows={0}
          manual
          columnCustomize
          name="compliance-tests"
          onFetchData={this.tableChangeHandler}
          onPageChange={this.handlePageChange}
          getTrProps={(state, rowInfo) => (
            {
              style: {
                opacity: (rowInfo && rowInfo.original.masked === 'true') ? 0.5 : 1,
              },
            }
          )}
          getTdProps={(state, rowInfo) => ({
            onClick: () => this.handleDescClick(rowInfo.original.doc_id),
            style: {
              cursor: 'pointer',
            },
          })}
          columns={[
            {
              Header: 'Timestamp',
              accessor: row => (
                dateTimeFormat(row['@timestamp'])
              ),
              id: 'timestamp',
              minWidth: 115,
            },
            {
              Header: 'Status',
              accessor: 'status',
              sortable: false,
              maxWidth: 150,
              Cell: row => (
                <div
                  className={`compliance-${checkType}-${row.value} label box`}>
                  {row.value}
                </div>
              ),
            },
            // {
            //   Header: 'Category',
            //   accessor: 'test_category',
            //   sortable: false,
            // },
            {
              Header: 'Description',
              accessor: 'description',
              id: 'test_desc',
              sortable: false,
              // Cell: row => (
              //   <span
              //     className="clickable"
              //     title={row.value.description}
              //   >
              //     {row.value.description}
              //   </span>
              // ),
              minWidth: 400,
            },
            multiSelectColumn,
          ]}
        />
        {
          this.state.isTestModalOpen && this.state.testData ? (
            <ComplianceTestModal
              data={this.state.testData}
              onRequestClose={() => {
                this.setState({
                  isTestModalOpen: false,
                  testData: null
                });
              }}
            />
          ) : null
        }
      </div>
    );
  }
}



function mapStateToProps(state) {
  return {
    test: state.get('compliance_result_scans'),
    isTableJSONViewModal: state.get('isTableJSONViewModal'),
  };
}

const PollableComplianceTests = connect(mapStateToProps)(pollable()(ComplianceTests));

export default withMultiSelectColumn({
  name: 'compliance-test',
  column: {
    name: 'Action',
    accessor: '_id',
  },
})(PollableComplianceTests);
