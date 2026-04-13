import PropTypes from 'prop-types';

 itemFields.PropTypes = {
  name: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  type:PropTypes.oneOf(['text', 'number','currency','date','checkbox']),
  options:PropTypes.array,
  readonly:PropTypes.bool,
  
}